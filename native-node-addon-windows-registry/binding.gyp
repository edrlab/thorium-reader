# https://github.com/desktop/registry-js/blob/master/binding.gyp

{
  'targets': [
    {
      'target_name': 'windows-registry',
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
#      'xcode_settings': { 'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
#        'CLANG_CXX_LIBRARY': 'libc++',
#        'MACOSX_DEPLOYMENT_TARGET': '10.7',
#      },
      'msvs_settings': {
        'VCCLCompilerTool': { 'ExceptionHandling': 1 },
      },
      'include_dirs': [
        '<!(node -p "require(\'node-addon-api\').include_dir")' ],
      'defines': [
#        "NAPI_VERSION=<(napi_build_version)",
        "NAPI_VERSION=3",
      ],
      'conditions': [
        ['OS=="win"', {
          'sources': [
            'main.cc',
          ],
          'msvs_disabled_warnings': [
            4267,  # conversion from 'size_t' to 'int', possible loss of data
            4530,  # C++ exception handler used, but unwind semantics are not enabled
            4506,  # no definition for inline function
          ],
        }],
      ],
    }
  ]
}
