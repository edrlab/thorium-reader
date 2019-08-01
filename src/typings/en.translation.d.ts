declare namespace typed_i18n {
  interface TFunction {
    (_: "accessibility", __?: {}): {
      readonly "bookAuthor": string,
      readonly "bookPublisher": string,
      readonly "bookReleaseDate": string,
      readonly "bookTitle": string,
      readonly "closeDialog": string,
      readonly "homeMenu": string,
      readonly "importFile": string,
      readonly "searchBook": string,
      readonly "skipLink": string
    };
    (_: "accessibility.bookAuthor", __?: {}): string;
    (_: "accessibility.bookPublisher", __?: {}): string;
    (_: "accessibility.bookReleaseDate", __?: {}): string;
    (_: "accessibility.bookTitle", __?: {}): string;
    (_: "accessibility.closeDialog", __?: {}): string;
    (_: "accessibility.homeMenu", __?: {}): string;
    (_: "accessibility.importFile", __?: {}): string;
    (_: "accessibility.searchBook", __?: {}): string;
    (_: "accessibility.skipLink", __?: {}): string;
    (_: "app", __?: {}): {
      readonly "edit": {
        readonly "copy": string,
        readonly "cut": string,
        readonly "paste": string,
        readonly "redo": string,
        readonly "selectAll": string,
        readonly "title": string,
        readonly "undo": string
      },
      readonly "quit": string
    };
    (_: "app.edit", __?: {}): {
      readonly "copy": string,
      readonly "cut": string,
      readonly "paste": string,
      readonly "redo": string,
      readonly "selectAll": string,
      readonly "title": string,
      readonly "undo": string
    };
    (_: "app.edit.copy", __?: {}): string;
    (_: "app.edit.cut", __?: {}): string;
    (_: "app.edit.paste", __?: {}): string;
    (_: "app.edit.redo", __?: {}): string;
    (_: "app.edit.selectAll", __?: {}): string;
    (_: "app.edit.title", __?: {}): string;
    (_: "app.edit.undo", __?: {}): string;(_: "app.quit", __?: {}): string;
    (_: "catalog", __?: {}): {
      readonly "about": { readonly "button": string, readonly "title": string },
      readonly "addBookToLib": string,
      readonly "addTags": string,
      readonly "addTeaserToLib": string,
      readonly "allBooks": string,
      readonly "bookInfo": string,
      readonly "delete": string,
      readonly "deleteBook": string,
      readonly "deleteTag": string,
      readonly "description": string,
      readonly "emptyTagList": string,
      readonly "entry": {
        readonly "continueReading": string,
        readonly "lastAdditions": string
      },
      readonly "export": string,
      readonly "id": string,
      readonly "lang": string,
      readonly "moreInfo": string,
      readonly "myBooks": string,
      readonly "noPublicationHelp": string,
      readonly "publisher": string,
      readonly "readBook": string,
      readonly "released": string,
      readonly "sort": string,
      readonly "tagCount": string,
      readonly "tags": string
    };
    (_: "catalog.about", __?: {}): { readonly "button": string, readonly "title": string };
    (_: "catalog.about.button", __?: {}): string;
    (_: "catalog.about.title", __?: {}): string;
    (_: "catalog.addBookToLib", __?: {}): string;
    (_: "catalog.addTags", __?: {}): string;
    (_: "catalog.addTeaserToLib", __?: {}): string;
    (_: "catalog.allBooks", __?: {}): string;
    (_: "catalog.bookInfo", __?: {}): string;
    (_: "catalog.delete", __?: {}): string;
    (_: "catalog.deleteBook", __?: {}): string;
    (_: "catalog.deleteTag", __?: {}): string;
    (_: "catalog.description", __?: {}): string;
    (_: "catalog.emptyTagList", __?: {}): string;
    (_: "catalog.entry", __?: {}): { readonly "continueReading": string, readonly "lastAdditions": string };
    (_: "catalog.entry.continueReading", __?: {}): string;
    (_: "catalog.entry.lastAdditions", __?: {}): string;
    (_: "catalog.export", __?: {}): string;(_: "catalog.id", __?: {}): string;
    (_: "catalog.lang", __?: {}): string;
    (_: "catalog.moreInfo", __?: {}): string;
    (_: "catalog.myBooks", __?: {}): string;
    (_: "catalog.noPublicationHelp", __?: {}): string;
    (_: "catalog.publisher", __?: {}): string;
    (_: "catalog.readBook", __?: {}): string;
    (_: "catalog.released", __?: {}): string;
    (_: "catalog.sort", __?: {}): string;
    (_: "catalog.tagCount", __?: {}): string;
    (_: "catalog.tags", __?: {}): string;
    (_: "dialog", __?: {}): {
      readonly "alreadyAdd": string,
      readonly "closeModalWindow": string,
      readonly "delete": string,
      readonly "deleteOpds": string,
      readonly "import": string,
      readonly "importError": string,
      readonly "no": string,
      readonly "renew": string,
      readonly "return": string,
      readonly "sure": string,
      readonly "yes": string
    };
    (_: "dialog.alreadyAdd", __?: {}): string;
    (_: "dialog.closeModalWindow", __?: {}): string;
    (_: "dialog.delete", __?: {}): string;
    (_: "dialog.deleteOpds", __?: {}): string;
    (_: "dialog.import", __?: {}): string;
    (_: "dialog.importError", __?: {}): string;
    (_: "dialog.no", __?: {}): string;(_: "dialog.renew", __?: {}): string;
    (_: "dialog.return", __?: {}): string;(_: "dialog.sure", __?: {}): string;
    (_: "dialog.yes", __?: {}): string;
    (_: "header", __?: {}): {
      readonly "allBooks": string,
      readonly "books": string,
      readonly "catalogs": string,
      readonly "gridTitle": string,
      readonly "home": string,
      readonly "importTitle": string,
      readonly "listTitle": string,
      readonly "searchPlaceholder": string,
      readonly "searchTitle": string,
      readonly "settings": string
    };
    (_: "header.allBooks", __?: {}): string;
    (_: "header.books", __?: {}): string;
    (_: "header.catalogs", __?: {}): string;
    (_: "header.gridTitle", __?: {}): string;
    (_: "header.home", __?: {}): string;
    (_: "header.importTitle", __?: {}): string;
    (_: "header.listTitle", __?: {}): string;
    (_: "header.searchPlaceholder", __?: {}): string;
    (_: "header.searchTitle", __?: {}): string;
    (_: "header.settings", __?: {}): string;
    (_: "library", __?: {}): {
      readonly "add": string,
      readonly "cancelDownload": string,
      readonly "endDownload": string,
      readonly "heading": string,
      readonly "lcp": {
        readonly "cancel": string,
        readonly "hint": string,
        readonly "informations": {
          readonly "close": string,
          readonly "issued": string,
          readonly "provider": string,
          readonly "right": {
            readonly "copy": string,
            readonly "end": string,
            readonly "print": string,
            readonly "start": string,
            readonly "title": string
          },
          readonly "title": string,
          readonly "updated": string
        },
        readonly "password": string,
        readonly "sentence": string,
        readonly "submit": string,
        readonly "title": string
      },
      readonly "startDownload": string,
      readonly "svg": {
        readonly "card": string,
        readonly "list": string,
        readonly "showParaphrase": string
      }
    };
    (_: "library.add", __?: {}): string;
    (_: "library.cancelDownload", __?: {}): string;
    (_: "library.endDownload", __?: {}): string;
    (_: "library.heading", __?: {}): string;
    (_: "library.lcp", __?: {}): {
      readonly "cancel": string,
      readonly "hint": string,
      readonly "informations": {
        readonly "close": string,
        readonly "issued": string,
        readonly "provider": string,
        readonly "right": {
          readonly "copy": string,
          readonly "end": string,
          readonly "print": string,
          readonly "start": string,
          readonly "title": string
        },
        readonly "title": string,
        readonly "updated": string
      },
      readonly "password": string,
      readonly "sentence": string,
      readonly "submit": string,
      readonly "title": string
    };
    (_: "library.lcp.cancel", __?: {}): string;
    (_: "library.lcp.hint", __?: {}): string;
    (_: "library.lcp.informations", __?: {}): {
      readonly "close": string,
      readonly "issued": string,
      readonly "provider": string,
      readonly "right": {
        readonly "copy": string,
        readonly "end": string,
        readonly "print": string,
        readonly "start": string,
        readonly "title": string
      },
      readonly "title": string,
      readonly "updated": string
    };
    (_: "library.lcp.informations.close", __?: {}): string;
    (_: "library.lcp.informations.issued", __?: {}): string;
    (_: "library.lcp.informations.provider", __?: {}): string;
    (_: "library.lcp.informations.right", __?: {}): {
      readonly "copy": string,
      readonly "end": string,
      readonly "print": string,
      readonly "start": string,
      readonly "title": string
    };
    (_: "library.lcp.informations.right.copy", __?: {}): string;
    (_: "library.lcp.informations.right.end", __?: {}): string;
    (_: "library.lcp.informations.right.print", __?: {}): string;
    (_: "library.lcp.informations.right.start", __?: {}): string;
    (_: "library.lcp.informations.right.title", __?: {}): string;
    (_: "library.lcp.informations.title", __?: {}): string;
    (_: "library.lcp.informations.updated", __?: {}): string;
    (_: "library.lcp.password", __?: {}): string;
    (_: "library.lcp.sentence", __?: {}): string;
    (_: "library.lcp.submit", __?: {}): string;
    (_: "library.lcp.title", __?: {}): string;
    (_: "library.startDownload", __?: {}): string;
    (_: "library.svg", __?: {}): {
      readonly "card": string,
      readonly "list": string,
      readonly "showParaphrase": string
    };
    (_: "library.svg.card", __?: {}): string;
    (_: "library.svg.list", __?: {}): string;
    (_: "library.svg.showParaphrase", __?: {}): string;
    (_: "message", __?: {}): {
      readonly "download": {
        readonly "start": string,
        readonly "success": string
      },
      readonly "import": { readonly "success": string },
      readonly "lcp": {
        readonly "passphraseError": string,
        readonly "renewError": string,
        readonly "renewSuccess": string,
        readonly "returnError": string,
        readonly "returnSuccess": string
      }
    };
    (_: "message.download", __?: {}): { readonly "start": string, readonly "success": string };
    (_: "message.download.start", __?: {}): string;
    (_: "message.download.success", __?: {}): string;
    (_: "message.import", __?: {}): { readonly "success": string };
    (_: "message.import.success", __?: {}): string;
    (_: "message.lcp", __?: {}): {
      readonly "passphraseError": string,
      readonly "renewError": string,
      readonly "renewSuccess": string,
      readonly "returnError": string,
      readonly "returnSuccess": string
    };
    (_: "message.lcp.passphraseError", __?: {}): string;
    (_: "message.lcp.renewError", __?: {}): string;
    (_: "message.lcp.renewSuccess", __?: {}): string;
    (_: "message.lcp.returnError", __?: {}): string;
    (_: "message.lcp.returnSuccess", __?: {}): string;
    (_: "opds", __?: {}): {
      readonly "addForm": {
        readonly "addButton": string,
        readonly "addSentence": string,
        readonly "delete": string,
        readonly "name": string,
        readonly "namePlaceholder": string,
        readonly "pasteUrl": string,
        readonly "title": string,
        readonly "update": string,
        readonly "updateSentence": string,
        readonly "url": string,
        readonly "urlPlaceholder": string
      },
      readonly "addMenu": string,
      readonly "authentication": {
        readonly "loginButton": string,
        readonly "password": string,
        readonly "sentence": string,
        readonly "username": string
      },
      readonly "back": string,
      readonly "breadcrumbRoot": string,
      readonly "download": string,
      readonly "downloadError": string,
      readonly "formError": string,
      readonly "menu": {
        readonly "aboutBook": string,
        readonly "addExtract": string,
        readonly "addTeaser": string,
        readonly "goBuyBook": string,
        readonly "goLoanBook": string,
        readonly "goSubBook": string
      },
      readonly "settings": string,
      readonly "svg": { readonly "opds": string }
    };
    (_: "opds.addForm", __?: {}): {
      readonly "addButton": string,
      readonly "addSentence": string,
      readonly "delete": string,
      readonly "name": string,
      readonly "namePlaceholder": string,
      readonly "pasteUrl": string,
      readonly "title": string,
      readonly "update": string,
      readonly "updateSentence": string,
      readonly "url": string,
      readonly "urlPlaceholder": string
    };
    (_: "opds.addForm.addButton", __?: {}): string;
    (_: "opds.addForm.addSentence", __?: {}): string;
    (_: "opds.addForm.delete", __?: {}): string;
    (_: "opds.addForm.name", __?: {}): string;
    (_: "opds.addForm.namePlaceholder", __?: {}): string;
    (_: "opds.addForm.pasteUrl", __?: {}): string;
    (_: "opds.addForm.title", __?: {}): string;
    (_: "opds.addForm.update", __?: {}): string;
    (_: "opds.addForm.updateSentence", __?: {}): string;
    (_: "opds.addForm.url", __?: {}): string;
    (_: "opds.addForm.urlPlaceholder", __?: {}): string;
    (_: "opds.addMenu", __?: {}): string;
    (_: "opds.authentication", __?: {}): {
      readonly "loginButton": string,
      readonly "password": string,
      readonly "sentence": string,
      readonly "username": string
    };
    (_: "opds.authentication.loginButton", __?: {}): string;
    (_: "opds.authentication.password", __?: {}): string;
    (_: "opds.authentication.sentence", __?: {}): string;
    (_: "opds.authentication.username", __?: {}): string;
    (_: "opds.back", __?: {}): string;
    (_: "opds.breadcrumbRoot", __?: {}): string;
    (_: "opds.download", __?: {}): string;
    (_: "opds.downloadError", __?: {}): string;
    (_: "opds.formError", __?: {}): string;
    (_: "opds.menu", __?: {}): {
      readonly "aboutBook": string,
      readonly "addExtract": string,
      readonly "addTeaser": string,
      readonly "goBuyBook": string,
      readonly "goLoanBook": string,
      readonly "goSubBook": string
    };
    (_: "opds.menu.aboutBook", __?: {}): string;
    (_: "opds.menu.addExtract", __?: {}): string;
    (_: "opds.menu.addTeaser", __?: {}): string;
    (_: "opds.menu.goBuyBook", __?: {}): string;
    (_: "opds.menu.goLoanBook", __?: {}): string;
    (_: "opds.menu.goSubBook", __?: {}): string;
    (_: "opds.settings", __?: {}): string;
    (_: "opds.svg", __?: {}): { readonly "opds": string };
    (_: "opds.svg.opds", __?: {}): string;
    (_: "publication", __?: {}): {
      readonly "cancelDownloadButton": string,
      readonly "canceledDownload": string,
      readonly "deleteButton": string,
      readonly "downloadButton": string,
      readonly "endDownload": string,
      readonly "expiredLcp": string,
      readonly "failedDownload": string,
      readonly "infoButton": string,
      readonly "progressDownload": string,
      readonly "readButton": string,
      readonly "renewButton": string,
      readonly "renewSentence": string,
      readonly "returnButton": string,
      readonly "returnSentence": string,
      readonly "returnedLcp": string,
      readonly "revokedLcp": string,
      readonly "seeLess": string,
      readonly "seeMore": string
    };
    (_: "publication.cancelDownloadButton", __?: {}): string;
    (_: "publication.canceledDownload", __?: {}): string;
    (_: "publication.deleteButton", __?: {}): string;
    (_: "publication.downloadButton", __?: {}): string;
    (_: "publication.endDownload", __?: {}): string;
    (_: "publication.expiredLcp", __?: {}): string;
    (_: "publication.failedDownload", __?: {}): string;
    (_: "publication.infoButton", __?: {}): string;
    (_: "publication.progressDownload", __?: {}): string;
    (_: "publication.readButton", __?: {}): string;
    (_: "publication.renewButton", __?: {}): string;
    (_: "publication.renewSentence", __?: {}): string;
    (_: "publication.returnButton", __?: {}): string;
    (_: "publication.returnSentence", __?: {}): string;
    (_: "publication.returnedLcp", __?: {}): string;
    (_: "publication.revokedLcp", __?: {}): string;
    (_: "publication.seeLess", __?: {}): string;
    (_: "publication.seeMore", __?: {}): string;
    (_: "reader", __?: {}): {
      readonly "footerInfo": {
        readonly "lessInfo": string,
        readonly "moreInfo": string
      },
      readonly "marks": {
        readonly "annotations": string,
        readonly "bookmarks": string,
        readonly "illustrations": string,
        readonly "landmarks": string,
        readonly "toc": string
      },
      readonly "navigation": {
        readonly "backHomeTitle": string,
        readonly "bookmarkTitle": string,
        readonly "detachWindowTitle": string,
        readonly "fullscreenTitle": string,
        readonly "infoTitle": string,
        readonly "openTableOfContentsTitle": string,
        readonly "quitFullscreenTitle": string,
        readonly "readBookTitle": string,
        readonly "settingsTitle": string
      },
      readonly "settings": {
        readonly "DefaultFont": string,
        readonly "accessibility": string,
        readonly "column": {
          readonly "auto": string,
          readonly "one": string,
          readonly "oneTitle": string,
          readonly "title": string,
          readonly "two": string,
          readonly "twoTitle": string
        },
        readonly "display": string,
        readonly "disposition": {
          readonly "title": string,
          readonly "with": string,
          readonly "without": string
        },
        readonly "font": string,
        readonly "fontSize": string,
        readonly "justification": string,
        readonly "justify": string,
        readonly "left": string,
        readonly "letterSpacing": string,
        readonly "lineSpacing": string,
        readonly "margin": string,
        readonly "paginated": string,
        readonly "right": string,
        readonly "scrolled": string,
        readonly "spacing": string,
        readonly "text": string,
        readonly "theme": {
          readonly "create": string,
          readonly "myTheme": string,
          readonly "name": {
            readonly "Neutral": string,
            readonly "Night": string,
            readonly "Sepia": string
          },
          readonly "predefined": string,
          readonly "title": string
        },
        readonly "title": string,
        readonly "wordSpacing": string
      },
      readonly "svg": {
        readonly "alignCenter": string,
        readonly "alignLeft": string,
        readonly "alignRight": string,
        readonly "contentTable": string,
        readonly "continue": string,
        readonly "document": string,
        readonly "landmark": string,
        readonly "left": string,
        readonly "night": string,
        readonly "right": string,
        readonly "settings": string
      }
    };
    (_: "reader.footerInfo", __?: {}): { readonly "lessInfo": string, readonly "moreInfo": string };
    (_: "reader.footerInfo.lessInfo", __?: {}): string;
    (_: "reader.footerInfo.moreInfo", __?: {}): string;
    (_: "reader.marks", __?: {}): {
      readonly "annotations": string,
      readonly "bookmarks": string,
      readonly "illustrations": string,
      readonly "landmarks": string,
      readonly "toc": string
    };
    (_: "reader.marks.annotations", __?: {}): string;
    (_: "reader.marks.bookmarks", __?: {}): string;
    (_: "reader.marks.illustrations", __?: {}): string;
    (_: "reader.marks.landmarks", __?: {}): string;
    (_: "reader.marks.toc", __?: {}): string;
    (_: "reader.navigation", __?: {}): {
      readonly "backHomeTitle": string,
      readonly "bookmarkTitle": string,
      readonly "detachWindowTitle": string,
      readonly "fullscreenTitle": string,
      readonly "infoTitle": string,
      readonly "openTableOfContentsTitle": string,
      readonly "quitFullscreenTitle": string,
      readonly "readBookTitle": string,
      readonly "settingsTitle": string
    };
    (_: "reader.navigation.backHomeTitle", __?: {}): string;
    (_: "reader.navigation.bookmarkTitle", __?: {}): string;
    (_: "reader.navigation.detachWindowTitle", __?: {}): string;
    (_: "reader.navigation.fullscreenTitle", __?: {}): string;
    (_: "reader.navigation.infoTitle", __?: {}): string;
    (_: "reader.navigation.openTableOfContentsTitle", __?: {}): string;
    (_: "reader.navigation.quitFullscreenTitle", __?: {}): string;
    (_: "reader.navigation.readBookTitle", __?: {}): string;
    (_: "reader.navigation.settingsTitle", __?: {}): string;
    (_: "reader.settings", __?: {}): {
      readonly "DefaultFont": string,
      readonly "accessibility": string,
      readonly "column": {
        readonly "auto": string,
        readonly "one": string,
        readonly "oneTitle": string,
        readonly "title": string,
        readonly "two": string,
        readonly "twoTitle": string
      },
      readonly "display": string,
      readonly "disposition": {
        readonly "title": string,
        readonly "with": string,
        readonly "without": string
      },
      readonly "font": string,
      readonly "fontSize": string,
      readonly "justification": string,
      readonly "justify": string,
      readonly "left": string,
      readonly "letterSpacing": string,
      readonly "lineSpacing": string,
      readonly "margin": string,
      readonly "paginated": string,
      readonly "right": string,
      readonly "scrolled": string,
      readonly "spacing": string,
      readonly "text": string,
      readonly "theme": {
        readonly "create": string,
        readonly "myTheme": string,
        readonly "name": {
          readonly "Neutral": string,
          readonly "Night": string,
          readonly "Sepia": string
        },
        readonly "predefined": string,
        readonly "title": string
      },
      readonly "title": string,
      readonly "wordSpacing": string
    };
    (_: "reader.settings.DefaultFont", __?: {}): string;
    (_: "reader.settings.accessibility", __?: {}): string;
    (_: "reader.settings.column", __?: {}): {
      readonly "auto": string,
      readonly "one": string,
      readonly "oneTitle": string,
      readonly "title": string,
      readonly "two": string,
      readonly "twoTitle": string
    };
    (_: "reader.settings.column.auto", __?: {}): string;
    (_: "reader.settings.column.one", __?: {}): string;
    (_: "reader.settings.column.oneTitle", __?: {}): string;
    (_: "reader.settings.column.title", __?: {}): string;
    (_: "reader.settings.column.two", __?: {}): string;
    (_: "reader.settings.column.twoTitle", __?: {}): string;
    (_: "reader.settings.display", __?: {}): string;
    (_: "reader.settings.disposition", __?: {}): {
      readonly "title": string,
      readonly "with": string,
      readonly "without": string
    };
    (_: "reader.settings.disposition.title", __?: {}): string;
    (_: "reader.settings.disposition.with", __?: {}): string;
    (_: "reader.settings.disposition.without", __?: {}): string;
    (_: "reader.settings.font", __?: {}): string;
    (_: "reader.settings.fontSize", __?: {}): string;
    (_: "reader.settings.justification", __?: {}): string;
    (_: "reader.settings.justify", __?: {}): string;
    (_: "reader.settings.left", __?: {}): string;
    (_: "reader.settings.letterSpacing", __?: {}): string;
    (_: "reader.settings.lineSpacing", __?: {}): string;
    (_: "reader.settings.margin", __?: {}): string;
    (_: "reader.settings.paginated", __?: {}): string;
    (_: "reader.settings.right", __?: {}): string;
    (_: "reader.settings.scrolled", __?: {}): string;
    (_: "reader.settings.spacing", __?: {}): string;
    (_: "reader.settings.text", __?: {}): string;
    (_: "reader.settings.theme", __?: {}): {
      readonly "create": string,
      readonly "myTheme": string,
      readonly "name": {
        readonly "Neutral": string,
        readonly "Night": string,
        readonly "Sepia": string
      },
      readonly "predefined": string,
      readonly "title": string
    };
    (_: "reader.settings.theme.create", __?: {}): string;
    (_: "reader.settings.theme.myTheme", __?: {}): string;
    (_: "reader.settings.theme.name", __?: {}): {
      readonly "Neutral": string,
      readonly "Night": string,
      readonly "Sepia": string
    };
    (_: "reader.settings.theme.name.Neutral", __?: {}): string;
    (_: "reader.settings.theme.name.Night", __?: {}): string;
    (_: "reader.settings.theme.name.Sepia", __?: {}): string;
    (_: "reader.settings.theme.predefined", __?: {}): string;
    (_: "reader.settings.theme.title", __?: {}): string;
    (_: "reader.settings.title", __?: {}): string;
    (_: "reader.settings.wordSpacing", __?: {}): string;
    (_: "reader.svg", __?: {}): {
      readonly "alignCenter": string,
      readonly "alignLeft": string,
      readonly "alignRight": string,
      readonly "contentTable": string,
      readonly "continue": string,
      readonly "document": string,
      readonly "landmark": string,
      readonly "left": string,
      readonly "night": string,
      readonly "right": string,
      readonly "settings": string
    };
    (_: "reader.svg.alignCenter", __?: {}): string;
    (_: "reader.svg.alignLeft", __?: {}): string;
    (_: "reader.svg.alignRight", __?: {}): string;
    (_: "reader.svg.contentTable", __?: {}): string;
    (_: "reader.svg.continue", __?: {}): string;
    (_: "reader.svg.document", __?: {}): string;
    (_: "reader.svg.landmark", __?: {}): string;
    (_: "reader.svg.left", __?: {}): string;
    (_: "reader.svg.night", __?: {}): string;
    (_: "reader.svg.right", __?: {}): string;
    (_: "reader.svg.settings", __?: {}): string;
    (_: "settings", __?: {}): {
      readonly "information": string,
      readonly "language": { readonly "languageChoice": string },
      readonly "manageTags": string,
      readonly "uiLanguage": string
    };
    (_: "settings.information", __?: {}): string;
    (_: "settings.language", __?: {}): { readonly "languageChoice": string };
    (_: "settings.language.languageChoice", __?: {}): string;
    (_: "settings.manageTags", __?: {}): string;
    (_: "settings.uiLanguage", __?: {}): string;
    (_: "toolbar", __?: {}): {
      readonly "about": string,
      readonly "help": string,
      readonly "news": string,
      readonly "svg": {
        readonly "addEpub": string,
        readonly "help": string,
        readonly "news": string,
        readonly "opds": string,
        readonly "others": string
      },
      readonly "sync": string
    };
    (_: "toolbar.about", __?: {}): string;
    (_: "toolbar.help", __?: {}): string;(_: "toolbar.news", __?: {}): string;
    (_: "toolbar.svg", __?: {}): {
      readonly "addEpub": string,
      readonly "help": string,
      readonly "news": string,
      readonly "opds": string,
      readonly "others": string
    };
    (_: "toolbar.svg.addEpub", __?: {}): string;
    (_: "toolbar.svg.help", __?: {}): string;
    (_: "toolbar.svg.news", __?: {}): string;
    (_: "toolbar.svg.opds", __?: {}): string;
    (_: "toolbar.svg.others", __?: {}): string;
    (_: "toolbar.sync", __?: {}): string;
    (_: "update", __?: {}): { readonly "available": string };
    (_: "update.available", __?: {}): string
  }
}
export = typed_i18n;
