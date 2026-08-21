// https://github.com/desktop/registry-js/blob/master/src/main.cc

#define STRICT
#define UNICODE

#include "napi.h"
#include "uv.h"

#include <assert.h>
#include <windows.h>

#include <cstdio>
#include <memory>

using namespace Napi;

namespace {

const DWORD MAX_VALUE_NAME = 16383;

LPWSTR utf8ToWideChar(std::string utf8) {
  int wide_char_length = MultiByteToWideChar(CP_UTF8,
    0,
    utf8.c_str(),
    -1,
    nullptr,
    0);
  if (wide_char_length == 0) {
    return nullptr;
  }

  LPWSTR result = new WCHAR[wide_char_length];
  if (MultiByteToWideChar(CP_UTF8,
    0,
    utf8.c_str(),
    -1,
    result,
    wide_char_length) == 0) {
      delete[] result;
      return nullptr;
  }

  return result;
}

Napi::Object CreateEntry(const Napi::Env& env, LPWSTR name, const LPWSTR type, LPWSTR data, DWORD dataLengthBytes)
{
  // NB: We must verify the data, since there's no guarantee that REG_SZ are stored with null terminators.

  // Test is ">= sizeof(wchar_t)" because otherwise 1/2 - 1 = -1 and things go kabloom:
  if (dataLengthBytes >= sizeof(wchar_t) && data[dataLengthBytes/sizeof(wchar_t) - 1] == L'\0')
  {
    // The string is (correctly) null-terminated.
    // Trim off the null terminator before handing it to NewFromTwoByte:
    dataLengthBytes -= sizeof(wchar_t);
  }

  // ... otherwise, it's not null-terminated, but we're passing the explicit length
  // to NewFromTwoByte anyway so we'll be fine (we won't over-read).

  auto obj = Napi::Object::New(env);
  obj.Set(Napi::String::New(env, "name"), Napi::String::New(env, (char16_t*)name));
  obj.Set(Napi::String::New(env, "type"), Napi::String::New(env, (char16_t*)type));
  obj.Set(Napi::String::New(env, "data"), Napi::String::New(env, (char16_t*)data, dataLengthBytes/sizeof(wchar_t)));
  return obj;
}

Napi::Object CreateEntry(const Napi::Env& env, LPWSTR name, const LPWSTR type, DWORD data)
{
  auto obj = Napi::Object::New(env);
  obj.Set(Napi::String::New(env, "name"), Napi::String::New(env, (char16_t*)name));
  obj.Set(Napi::String::New(env, "type"), Napi::String::New(env, (char16_t*)type));
  obj.Set(Napi::String::New(env, "data"), Napi::Number::New(env, static_cast<uint32_t>(data)));
  return obj;
}

Napi::Array EnumerateValues(const Napi::Env& env, HKEY hCurrentKey) {
  DWORD cValues, cchMaxValue, cbMaxValueData;

  auto retCode = RegQueryInfoKey(
    hCurrentKey,
    nullptr, // classname (not needed)
    nullptr, // classname length (not needed)
    nullptr, // reserved
    nullptr, // can ignore subkey values
    nullptr,
    nullptr,
    &cValues, // number of values for key
    &cchMaxValue, // longest value name
    &cbMaxValueData, // longest value data
    nullptr, // can ignore these values
    nullptr);

  if (retCode != ERROR_SUCCESS)
  {
    char errorMessage[49]; // 38 for message + 10 for int + 1 for nul
    sprintf_s(errorMessage, "RegQueryInfoKey failed - exit code: '%d'", retCode);
    Napi::Error::New(env, errorMessage).ThrowAsJavaScriptException();
    return Napi::Array::New(env, 0);
  }

  auto results = Napi::Array::New(env,  cValues);

  auto buffer = std::make_unique<BYTE[]>(cbMaxValueData);
  for (DWORD i = 0; i < cValues; i++)
  {
    auto cchValue = MAX_VALUE_NAME;
    WCHAR achValue[MAX_VALUE_NAME];
    achValue[0] = '\0';

    DWORD lpType;
    DWORD cbData = cbMaxValueData;

    auto retCode = RegEnumValue(
      hCurrentKey,
      i,
      achValue,
      &cchValue,
      nullptr,
      &lpType,
      buffer.get(),
      &cbData);

    if (retCode == ERROR_SUCCESS)
    {
      if (lpType == REG_SZ)
      {
        auto text = reinterpret_cast<LPWSTR>(buffer.get());
        auto obj = CreateEntry(env, achValue, (LPWSTR)L"REG_SZ", text, cbData);
        results.Set(i, obj);
      }
      else if (lpType == REG_EXPAND_SZ)
      {
        auto text = reinterpret_cast<LPWSTR>(buffer.get());
        auto obj = CreateEntry(env, achValue, (LPWSTR)L"REG_EXPAND_SZ", text, cbData);
        results.Set(i, obj);
      }
      else if (lpType == REG_DWORD)
      {
        assert(cbData == sizeof(DWORD));
        results.Set(i, CreateEntry(env, achValue, (LPWSTR)L"REG_DWORD", *reinterpret_cast<DWORD*>(buffer.get())));
      }
    }
    else if (retCode == ERROR_NO_MORE_ITEMS)
    {
      // no more items found, time to wrap up
      break;
    }
    else
    {
      char errorMessage[50]; // 39 for message + 10 for int  + 1 for nul
      sprintf_s(errorMessage, "RegEnumValue returned an error code: '%d'", retCode);
      Napi::Error::New(env, errorMessage).ThrowAsJavaScriptException();
      return Napi::Array::New(env, 0);
    }
  }

  return results;
}

Napi::Value ReadValues(const Napi::CallbackInfo& info)
{
  const Napi::Env& env = info.Env();

  if (info.Length() < 2)
  {
    Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (!info[0].IsNumber())
  {
    Napi::TypeError::New(env, "A number was expected for the first argument, but wasn't received.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (!info[1].IsString())
  {
    Napi::TypeError::New(env, "A string was expected for the second argument, but wasn't received.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  auto first = reinterpret_cast<HKEY>(info[0].As<Napi::Number>().Int64Value());

  std::string subkeyArg = info[1].As<Napi::String>();
  auto subkey = utf8ToWideChar(subkeyArg);

  if (subkey == nullptr)
  {
    Napi::TypeError::New(env, "A string was expected for the second argument, but could not be parsed.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  HKEY hCurrentKey;
  LONG openKey = RegOpenKeyEx(
    first,
    subkey,
    0,
    KEY_READ | KEY_WOW64_64KEY,
    &hCurrentKey);

  if (openKey == ERROR_FILE_NOT_FOUND)
  {
    // the key does not exist, just return an empty array for now
    return Napi::Array::New(env, 0);
  }
  else if (openKey == ERROR_SUCCESS)
  {
    Napi::Array results = EnumerateValues(env, hCurrentKey);
    RegCloseKey(hCurrentKey);
    return results;
  }
  else
  {
    char errorMessage[46]; // 35 for message + 10 for int + 1 for nul
    sprintf_s(errorMessage, "RegOpenKeyEx failed - exit code: '%d'", openKey);
    Napi::Error::New(env, errorMessage).ThrowAsJavaScriptException();
    return env.Undefined();
  }
}

// Napi::Value EnumKeys(const Napi::CallbackInfo& info) {
//   const Napi::Env& env = info.Env();

//   auto argCount = info.Length();
//   if (argCount != 1 && argCount != 2)
//   {
//     Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   if (!info[0].IsNumber())
//   {
//     Napi::TypeError::New(env, "A number was expected for the first argument, but wasn't received.").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   auto first = reinterpret_cast<HKEY>(info[0].As<Napi::Number>().Int64Value());

//   HKEY hCurrentKey = first;
//   if (argCount == 2 && !info[1].IsNull() && !info[1].IsUndefined())
//   {
//     if (!info[1].IsString())
//     {
//       Napi::TypeError::New(env, "A string was expected for the second argument, but wasn't received.").ThrowAsJavaScriptException();
//       return env.Undefined();
//     }
//     std::string subkeyArg = info[1].As<Napi::String>();
//     auto subkey = utf8ToWideChar(subkeyArg);
//     if (subkey == nullptr)
//     {
//       Napi::TypeError::New(env, "A string was expected for the second argument, but could not be parsed.").ThrowAsJavaScriptException();
//       return env.Undefined();
//     }

//     auto openKey = RegOpenKeyEx(
//         first,
//         subkey,
//         0,
//         KEY_READ | KEY_WOW64_64KEY,
//         &hCurrentKey);
//     if (openKey != ERROR_SUCCESS)
//     {
//       // FIXME: the key does not exist, just return an empty array for now
//       return Napi::Array::New(env, 0);
//     }
//   }

//   auto results = Napi::Array::New(env, 0);
//   WCHAR name[MAX_VALUE_NAME];
//   for (int i = 0;; i++)
//   {
//     DWORD nameLen = MAX_VALUE_NAME;
//     auto ret = RegEnumKeyEx(hCurrentKey, i, name, &nameLen, nullptr, nullptr, nullptr, nullptr);
//     if (ret == ERROR_SUCCESS)
//     {
//       results.Set(i, Napi::String::New(env, (char16_t*)name));
//       continue;
//     }
//     break; // FIXME: We should do better error handling here
//   }
//   if (hCurrentKey != first)
//     RegCloseKey(hCurrentKey);
//   return results;
// }

// Napi::Value CreateKey(const Napi::CallbackInfo& info)
// {
//   const Napi::Env& env = info.Env();

//   auto argCount = info.Length();
//   if (argCount != 2)
//   {
//     Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   if (!info[0].IsNumber())
//   {
//     Napi::TypeError::New(env, "A number was expected for the first argument, but wasn't received.").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   if (!info[1].IsString())
//   {
//     Napi::TypeError::New(env, "A string was expected for the second argument, but wasn't received.").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   auto first = reinterpret_cast<HKEY>(info[0].As<Napi::Number>().Int64Value());

//   HKEY hCurrentKey = first;
//   if (!info[1].IsNull() && !info[1].IsUndefined())
//   {
//     std::string subkeyArg = info[1].As<Napi::String>();
//     auto subKey = utf8ToWideChar(subkeyArg);
//     if (subKey == nullptr)
//     {
//       Napi::TypeError::New(env, "A string was expected for the second argument, but could not be parsed.").ThrowAsJavaScriptException();
//       return env.Undefined();
//     }
//     auto newKey = RegCreateKeyEx(
//         first,
//         subKey,
//         0,
//         nullptr,
//         REG_OPTION_NON_VOLATILE,
//         KEY_READ | KEY_WOW64_64KEY,
//         nullptr,
//         &hCurrentKey,
//         nullptr);
//     if (newKey != ERROR_SUCCESS)
//     {
//       // FIXME: the key does not exist, just return false for now
//       return Napi::Boolean::New(env, false);
//     }
//   }

//   if (hCurrentKey != first)
//     RegCloseKey(hCurrentKey);

//   return Napi::Boolean::New(env, true);
// }

// Napi::Value SetValue(const Napi::CallbackInfo& info)
// {
//   const Napi::Env& env = info.Env();

//   auto argCount = info.Length();
//   if (argCount != 5)
//   {
//     Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   if (!info[0].IsNumber())
//   {
//     Napi::TypeError::New(env, "A number was expected for the first argument, but wasn't received.").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   if (!info[1].IsString())
//   {
//     Napi::TypeError::New(env, "A string was expected for the second argument, but wasn't received.").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   if (!info[2].IsString())
//   {
//     Napi::TypeError::New(env, "A string was expected for the third argument, but wasn't received.").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   if (!info[3].IsString())
//   {
//     Napi::TypeError::New(env, "A string was expected for the fourth argument, but wasn't received.").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   if (!info[4].IsString())
//   {
//     Napi::TypeError::New(env, "A string was expected for the fifth argument, but wasn't received.").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   auto first = reinterpret_cast<HKEY>(info[0].As<Napi::Number>().Int64Value());

//   HKEY hCurrentKey = first;
//   std::string subkeyArg = info[1].As<Napi::String>();
//   auto subkey = utf8ToWideChar(subkeyArg);
//   if (subkey == nullptr)
//   {
//     Napi::TypeError::New(env, "A string was expected for the second argument, but could not be parsed.").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   std::string nameArg = info[2].As<Napi::String>();
//   auto valueName = utf8ToWideChar(nameArg);
//   if (valueName == nullptr)
//   {
//     Napi::TypeError::New(env, "A string was expected for the third argument, but could not be parsed.").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   std::string typeArg = info[3].As<Napi::String>();
//   auto valueType = utf8ToWideChar(typeArg);
//   if (valueType == nullptr)
//   {
//     Napi::TypeError::New(env, "A string was expected for the fourth argument, but could not be parsed.").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }

//   HKEY hOpenKey;
//   LONG openKey = RegOpenKeyEx(
//       first,
//       subkey,
//       0,
//       KEY_WRITE | KEY_WOW64_64KEY,
//       &hOpenKey);

//   if (openKey == ERROR_FILE_NOT_FOUND)
//   {
//     Napi::TypeError::New(env, "RegOpenKeyEx : cannot find the registrykey, error_code : ERROR_FILE_NOT_FOUND").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }
//   else if (openKey == ERROR_SUCCESS)
//   {
//     long setValue = ERROR_INVALID_HANDLE;

//     if (wcscmp(valueType, L"REG_SZ") == 0 || wcscmp(valueType, L"REG_EXPAND_SZ") == 0)
//     {
//       std::string typeArg = info[4].As<Napi::String>();
//       auto valueData = utf8ToWideChar(typeArg);
//       if (valueData == nullptr)
//       {
//         Napi::TypeError::New(env, "A string was expected for the fifth argument, but could not be parsed.").ThrowAsJavaScriptException();
//         return env.Undefined();
//       }
//       int datalength = static_cast<int>(wcslen(valueData) * sizeof(valueData[0]));
//       DWORD regType = wcscmp(valueType, L"REG_SZ") == 0 ? REG_SZ : REG_EXPAND_SZ;
//       setValue = RegSetValueEx(
//           hOpenKey,
//           valueName,
//           0,
//           regType,
//           (const BYTE *)valueData,
//           datalength);
//     }
//     else if (wcscmp(valueType, L"REG_DWORD") == 0)
//     {
//       uint32_t dwordData = info[4].ToNumber().Uint32Value();
//       DWORD valueData = static_cast<DWORD>(dwordData);

//       setValue = RegSetValueEx(
//           hOpenKey,
//           valueName,
//           0,
//           REG_DWORD,
//           (const BYTE *)&valueData,
//           sizeof(valueData));
//     }
//     else
//     {
//       char errorMessage[255];
//       sprintf_s(errorMessage, "RegSetValueEx Unmanaged type : '%ls'", valueType);
//       Napi::TypeError::New(env, errorMessage).ThrowAsJavaScriptException();
//       return env.Undefined();
//     }

//     if (setValue != ERROR_SUCCESS)
//     {
//       // FIXME: the key does not exist, just return false for now
//       return Napi::Boolean::New(env, false);
//     }
//     RegCloseKey(hOpenKey);
//     return Napi::Boolean::New(env, true);
//   }
//   else
//   {
//     char errorMessage[46]; // 35 for message + 10 for int + 1 for nul
//     sprintf_s(errorMessage, "RegOpenKeyEx failed - exit code: '%d'", openKey);
//     Napi::TypeError::New(env, errorMessage).ThrowAsJavaScriptException();
//     return env.Undefined();
//   }
// }

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  exports.Set(Napi::String::New(env, "readValues"), Napi::Function::New(env, ReadValues));
  // exports.Set(Napi::String::New(env, "enumKeys"), Napi::Function::New(env, EnumKeys));
  // exports.Set(Napi::String::New(env, "createKey"), Napi::Function::New(env, CreateKey));
  // exports.Set(Napi::String::New(env, "setValue"), Napi::Function::New(env, SetValue));

  return exports;
}
}

#if NODE_MAJOR_VERSION >= 10
NAN_MODULE_WORKER_ENABLED(registryNativeModule, Init)
#else
NODE_API_MODULE(registryNativeModule, Init);
#endif
