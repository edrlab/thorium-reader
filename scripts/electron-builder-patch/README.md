# Pending `electron-builder` PR
https://github.com/electron-userland/electron-builder/pull/4302/files

# JS diff check

`diff -Naur node_modules/app-builder-lib/out/targets/AppxTarget.js scripts/electron-builder-patch/AppxTarget.js`

=>

```
--- node_modules/app-builder-lib/out/targets/AppxTarget.js	1985-10-26 09:15:00.000000000 +0100
+++ scripts/electron-builder-patch/AppxTarget.js	2019-10-09 16:57:44.000000000 +0100
@@ -333,6 +333,7 @@
 
   getExtensions(executable, displayName) {
     const uriSchemes = (0, _builderUtil().asArray)(this.packager.config.protocols).concat((0, _builderUtil().asArray)(this.packager.platformSpecificBuildOptions.protocols));
+    const fileAssociations = (0, _builderUtil().asArray)(this.packager.config.fileAssociations).concat((0, _builderUtil().asArray)(this.packager.platformSpecificBuildOptions.fileAssociations));
     let isAddAutoLaunchExtension = this.options.addAutoLaunchExtension;
 
     if (isAddAutoLaunchExtension === undefined) {
@@ -340,7 +341,7 @@
       isAddAutoLaunchExtension = deps != null && deps["electron-winstore-auto-launch"] != null;
     }
 
-    if (!isAddAutoLaunchExtension && uriSchemes.length === 0) {
+    if (!isAddAutoLaunchExtension && uriSchemes.length === 0 && fileAssociations.length === 0) {
       return "";
     }
 
@@ -364,6 +365,19 @@
       }
     }
 
+    for (const fileAssociation of fileAssociations) {
+      for (const ext of (0, _builderUtil().asArray)(fileAssociation.ext)) {
+        extensions += `
+          <uap:Extension Category="windows.fileTypeAssociation">
+            <uap:FileTypeAssociation Name="${ext}">
+              <uap:SupportedFileTypes>
+                <uap:FileType>.${ext}</uap:FileType>
+              </uap:SupportedFileTypes>
+            </uap:FileTypeAssociation>
+          </uap:Extension>`;
+      }
+    }
+
     extensions += "</Extensions>";
     return extensions;
   }
```
