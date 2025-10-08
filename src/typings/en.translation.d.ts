declare namespace typed_i18n {
  interface TFunction {
  (_: "accessibility", __?: {}): {
  readonly "bookMenu": string,
  readonly "closeDialog": string,
  readonly "importFile": string,
  readonly "leftSlideButton": string,
  readonly "mainContent": string,
  readonly "rightSlideButton": string,
  readonly "skipLink": string,
  readonly "toolbar": string
};
  (_: "accessibility.bookMenu", __?: {}): string;
  (_: "accessibility.closeDialog", __?: {}): string;
  (_: "accessibility.importFile", __?: {}): string;
  (_: "accessibility.leftSlideButton", __?: {}): string;
  (_: "accessibility.mainContent", __?: {}): string;
  (_: "accessibility.rightSlideButton", __?: {}): string;
  (_: "accessibility.skipLink", __?: {}): string;
  (_: "accessibility.toolbar", __?: {}): string;
  (_: "apiapp", __?: {}): {
  readonly "documentation": string,
  readonly "howItWorks": string,
  readonly "informations": string,
  readonly "noLibraryFound": string
};
  (_: "apiapp.documentation", __?: {}): string;
  (_: "apiapp.howItWorks", __?: {}): string;
  (_: "apiapp.informations", __?: {}): string;
  (_: "apiapp.noLibraryFound", __?: {}): string;
  (_: "app", __?: {}): {
  readonly "edit": {
    readonly "copy": string,
    readonly "cut": string,
    readonly "paste": string,
    readonly "print": string,
    readonly "redo": string,
    readonly "selectAll": string,
    readonly "title": string,
    readonly "undo": string
  },
  readonly "hide": string,
  readonly "quit": string,
  readonly "session": {
    readonly "exit": {
      readonly "askBox": {
        readonly "button": { readonly "no": string, readonly "yes": string },
        readonly "help": string,
        readonly "message": string,
        readonly "title": string
      }
    }
  },
  readonly "update": { readonly "message": string, readonly "title": string },
  readonly "window": { readonly "showLibrary": string }
};
  (_: "app.edit", __?: {}): {
  readonly "copy": string,
  readonly "cut": string,
  readonly "paste": string,
  readonly "print": string,
  readonly "redo": string,
  readonly "selectAll": string,
  readonly "title": string,
  readonly "undo": string
};
  (_: "app.edit.copy", __?: {}): string;
  (_: "app.edit.cut", __?: {}): string;
  (_: "app.edit.paste", __?: {}): string;
  (_: "app.edit.print", __?: {}): string;
  (_: "app.edit.redo", __?: {}): string;
  (_: "app.edit.selectAll", __?: {}): string;
  (_: "app.edit.title", __?: {}): string;
  (_: "app.edit.undo", __?: {}): string; (_: "app.hide", __?: {}): string;
  (_: "app.quit", __?: {}): string;
  (_: "app.session", __?: {}): {
  readonly "exit": {
    readonly "askBox": {
      readonly "button": { readonly "no": string, readonly "yes": string },
      readonly "help": string,
      readonly "message": string,
      readonly "title": string
    }
  }
};
  (_: "app.session.exit", __?: {}): {
  readonly "askBox": {
    readonly "button": { readonly "no": string, readonly "yes": string },
    readonly "help": string,
    readonly "message": string,
    readonly "title": string
  }
};
  (_: "app.session.exit.askBox", __?: {}): {
  readonly "button": { readonly "no": string, readonly "yes": string },
  readonly "help": string,
  readonly "message": string,
  readonly "title": string
};
  (_: "app.session.exit.askBox.button", __?: {}): { readonly "no": string, readonly "yes": string };
  (_: "app.session.exit.askBox.button.no", __?: {}): string;
  (_: "app.session.exit.askBox.button.yes", __?: {}): string;
  (_: "app.session.exit.askBox.help", __?: {}): string;
  (_: "app.session.exit.askBox.message", __?: {}): string;
  (_: "app.session.exit.askBox.title", __?: {}): string;
  (_: "app.update", __?: {}): { readonly "message": string, readonly "title": string };
  (_: "app.update.message", __?: {}): string;
  (_: "app.update.title", __?: {}): string;
  (_: "app.window", __?: {}): { readonly "showLibrary": string };
  (_: "app.window.showLibrary", __?: {}): string;
  (_: "catalog", __?: {}): {
  readonly "about": { readonly "title": string },
  readonly "addBookToLib": string,
  readonly "addTags": string,
  readonly "addTagsButton": string,
  readonly "allBooks": string,
  readonly "bookInfo": string,
  readonly "column": {
    readonly "ascending": string,
    readonly "descending": string,
    readonly "unsorted": string
  },
  readonly "customization": {
    readonly "fallback": {
      readonly "description": string,
      readonly "publications": string,
      readonly "title": string
    }
  },
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
  readonly "exportAnnotation": string,
  readonly "format": string,
  readonly "importAnnotation": string,
  readonly "lang": string,
  readonly "lastRead": string,
  readonly "logout": string,
  readonly "moreInfo": string,
  readonly "myBooks": string,
  readonly "noPublicationHelpL1": string,
  readonly "noPublicationHelpL2": string,
  readonly "noPublicationHelpL3": string,
  readonly "noPublicationHelpL4": string,
  readonly "numberOfPages": string,
  readonly "opds": {
    readonly "auth": {
      readonly "cancel": string,
      readonly "login": string,
      readonly "password": string,
      readonly "register": string,
      readonly "username": string
    },
    readonly "info": {
      readonly "availableSince": string,
      readonly "availableState": {
        readonly "available": string,
        readonly "ready": string,
        readonly "reserved": string,
        readonly "unavailable": string,
        readonly "unknown": string
      },
      readonly "availableUntil": string,
      readonly "copyAvalaible": string,
      readonly "copyTotal": string,
      readonly "holdPosition": string,
      readonly "holdTotal": string,
      readonly "numberOfItems": string,
      readonly "priveValue": string,
      readonly "state": string
    }
  },
  readonly "publisher": string,
  readonly "readBook": string,
  readonly "released": string,
  readonly "sort": string,
  readonly "tag": string,
  readonly "tags": string,
  readonly "update": string
};
  (_: "catalog.about", __?: {}): { readonly "title": string };
  (_: "catalog.about.title", __?: {}): string;
  (_: "catalog.addBookToLib", __?: {}): string;
  (_: "catalog.addTags", __?: {}): string;
  (_: "catalog.addTagsButton", __?: {}): string;
  (_: "catalog.allBooks", __?: {}): string;
  (_: "catalog.bookInfo", __?: {}): string;
  (_: "catalog.column", __?: {}): {
  readonly "ascending": string,
  readonly "descending": string,
  readonly "unsorted": string
};
  (_: "catalog.column.ascending", __?: {}): string;
  (_: "catalog.column.descending", __?: {}): string;
  (_: "catalog.column.unsorted", __?: {}): string;
  (_: "catalog.customization", __?: {}): {
  readonly "fallback": {
    readonly "description": string,
    readonly "publications": string,
    readonly "title": string
  }
};
  (_: "catalog.customization.fallback", __?: {}): {
  readonly "description": string,
  readonly "publications": string,
  readonly "title": string
};
  (_: "catalog.customization.fallback.description", __?: {}): string;
  (_: "catalog.customization.fallback.publications", __?: {}): string;
  (_: "catalog.customization.fallback.title", __?: {}): string;
  (_: "catalog.delete", __?: {}): string;
  (_: "catalog.deleteBook", __?: {}): string;
  (_: "catalog.deleteTag", __?: {}): string;
  (_: "catalog.description", __?: {}): string;
  (_: "catalog.emptyTagList", __?: {}): string;
  (_: "catalog.entry", __?: {}): { readonly "continueReading": string, readonly "lastAdditions": string };
  (_: "catalog.entry.continueReading", __?: {}): string;
  (_: "catalog.entry.lastAdditions", __?: {}): string;
  (_: "catalog.export", __?: {}): string;
  (_: "catalog.exportAnnotation", __?: {}): string;
  (_: "catalog.format", __?: {}): string;
  (_: "catalog.importAnnotation", __?: {}): string;
  (_: "catalog.lang", __?: {}): string;
  (_: "catalog.lastRead", __?: {}): string;
  (_: "catalog.logout", __?: {}): string;
  (_: "catalog.moreInfo", __?: {}): string;
  (_: "catalog.myBooks", __?: {}): string;
  (_: "catalog.noPublicationHelpL1", __?: {}): string;
  (_: "catalog.noPublicationHelpL2", __?: {}): string;
  (_: "catalog.noPublicationHelpL3", __?: {}): string;
  (_: "catalog.noPublicationHelpL4", __?: {}): string;
  (_: "catalog.numberOfPages", __?: {}): string;
  (_: "catalog.opds", __?: {}): {
  readonly "auth": {
    readonly "cancel": string,
    readonly "login": string,
    readonly "password": string,
    readonly "register": string,
    readonly "username": string
  },
  readonly "info": {
    readonly "availableSince": string,
    readonly "availableState": {
      readonly "available": string,
      readonly "ready": string,
      readonly "reserved": string,
      readonly "unavailable": string,
      readonly "unknown": string
    },
    readonly "availableUntil": string,
    readonly "copyAvalaible": string,
    readonly "copyTotal": string,
    readonly "holdPosition": string,
    readonly "holdTotal": string,
    readonly "numberOfItems": string,
    readonly "priveValue": string,
    readonly "state": string
  }
};
  (_: "catalog.opds.auth", __?: {}): {
  readonly "cancel": string,
  readonly "login": string,
  readonly "password": string,
  readonly "register": string,
  readonly "username": string
};
  (_: "catalog.opds.auth.cancel", __?: {}): string;
  (_: "catalog.opds.auth.login", __?: {}): string;
  (_: "catalog.opds.auth.password", __?: {}): string;
  (_: "catalog.opds.auth.register", __?: {}): string;
  (_: "catalog.opds.auth.username", __?: {}): string;
  (_: "catalog.opds.info", __?: {}): {
  readonly "availableSince": string,
  readonly "availableState": {
    readonly "available": string,
    readonly "ready": string,
    readonly "reserved": string,
    readonly "unavailable": string,
    readonly "unknown": string
  },
  readonly "availableUntil": string,
  readonly "copyAvalaible": string,
  readonly "copyTotal": string,
  readonly "holdPosition": string,
  readonly "holdTotal": string,
  readonly "numberOfItems": string,
  readonly "priveValue": string,
  readonly "state": string
};
  (_: "catalog.opds.info.availableSince", __?: {}): string;
  (_: "catalog.opds.info.availableState", __?: {}): {
  readonly "available": string,
  readonly "ready": string,
  readonly "reserved": string,
  readonly "unavailable": string,
  readonly "unknown": string
};
  (_: "catalog.opds.info.availableState.available", __?: {}): string;
  (_: "catalog.opds.info.availableState.ready", __?: {}): string;
  (_: "catalog.opds.info.availableState.reserved", __?: {}): string;
  (_: "catalog.opds.info.availableState.unavailable", __?: {}): string;
  (_: "catalog.opds.info.availableState.unknown", __?: {}): string;
  (_: "catalog.opds.info.availableUntil", __?: {}): string;
  (_: "catalog.opds.info.copyAvalaible", __?: {}): string;
  (_: "catalog.opds.info.copyTotal", __?: {}): string;
  (_: "catalog.opds.info.holdPosition", __?: {}): string;
  (_: "catalog.opds.info.holdTotal", __?: {}): string;
  (_: "catalog.opds.info.numberOfItems", __?: {}): string;
  (_: "catalog.opds.info.priveValue", __?: {}): string;
  (_: "catalog.opds.info.state", __?: {}): string;
  (_: "catalog.publisher", __?: {}): string;
  (_: "catalog.readBook", __?: {}): string;
  (_: "catalog.released", __?: {}): string;
  (_: "catalog.sort", __?: {}): string; (_: "catalog.tag", __?: {}): string;
  (_: "catalog.tags", __?: {}): string;
  (_: "catalog.update", __?: {}): string;
  (_: "dialog", __?: {}): {
  readonly "annotations": {
    readonly "descAuthor": string,
    readonly "descCreator": string,
    readonly "descList": string,
    readonly "descNewer": string,
    readonly "descOlder": string,
    readonly "descTitle": string,
    readonly "importAll": string,
    readonly "importWithoutConflict": string,
    readonly "origin": string,
    readonly "title": string
  },
  readonly "cancel": string,
  readonly "customization": {
    readonly "splashscreen": {
      readonly "state": string,
      readonly "title": string
    }
  },
  readonly "deleteAnnotations": string,
  readonly "deleteAnnotationsText": string,
  readonly "deleteBookmarks": string,
  readonly "deleteBookmarksText": string,
  readonly "deleteFeed": string,
  readonly "deletePublication": string,
  readonly "deletePublicationWithNotes": string,
  readonly "import": string,
  readonly "importError": string,
  readonly "renew": string,
  readonly "return": string,
  readonly "yes": string
};
  (_: "dialog.annotations", __?: {}): {
  readonly "descAuthor": string,
  readonly "descCreator": string,
  readonly "descList": string,
  readonly "descNewer": string,
  readonly "descOlder": string,
  readonly "descTitle": string,
  readonly "importAll": string,
  readonly "importWithoutConflict": string,
  readonly "origin": string,
  readonly "title": string
};
  (_: "dialog.annotations.descAuthor", __?: {}): string;
  (_: "dialog.annotations.descCreator", __?: {}): string;
  (_: "dialog.annotations.descList", __?: {}): string;
  (_: "dialog.annotations.descNewer", __?: {}): string;
  (_: "dialog.annotations.descOlder", __?: {}): string;
  (_: "dialog.annotations.descTitle", __?: {}): string;
  (_: "dialog.annotations.importAll", __?: {}): string;
  (_: "dialog.annotations.importWithoutConflict", __?: {}): string;
  (_: "dialog.annotations.origin", __?: {}): string;
  (_: "dialog.annotations.title", __?: {}): string;
  (_: "dialog.cancel", __?: {}): string;
  (_: "dialog.customization", __?: {}): {
  readonly "splashscreen": {
    readonly "state": string,
    readonly "title": string
  }
};
  (_: "dialog.customization.splashscreen", __?: {}): { readonly "state": string, readonly "title": string };
  (_: "dialog.customization.splashscreen.state", __?: {}): string;
  (_: "dialog.customization.splashscreen.title", __?: {}): string;
  (_: "dialog.deleteAnnotations", __?: {}): string;
  (_: "dialog.deleteAnnotationsText", __?: {}): string;
  (_: "dialog.deleteBookmarks", __?: {}): string;
  (_: "dialog.deleteBookmarksText", __?: {}): string;
  (_: "dialog.deleteFeed", __?: {}): string;
  (_: "dialog.deletePublication", __?: {}): string;
  (_: "dialog.deletePublicationWithNotes", __?: {}): string;
  (_: "dialog.import", __?: {}): string;
  (_: "dialog.importError", __?: {}): string;
  (_: "dialog.renew", __?: {}): string;
  (_: "dialog.return", __?: {}): string; (_: "dialog.yes", __?: {}): string;
  (_: "error", __?: {}): {
  readonly "errorBox": {
    readonly "error": string,
    readonly "message": string,
    readonly "title": string
  }
};
  (_: "error.errorBox", __?: {}): {
  readonly "error": string,
  readonly "message": string,
  readonly "title": string
};
  (_: "error.errorBox.error", __?: {}): string;
  (_: "error.errorBox.message", __?: {}): string;
  (_: "error.errorBox.title", __?: {}): string;
  (_: "header", __?: {}): {
  readonly "allBooks": string,
  readonly "catalogs": string,
  readonly "downloads": string,
  readonly "fitlerTagTitle": string,
  readonly "gridTitle": string,
  readonly "home": string,
  readonly "homeTitle": string,
  readonly "importTitle": string,
  readonly "listTitle": string,
  readonly "myCatalogs": string,
  readonly "refreshTitle": string,
  readonly "searchPlaceholder": string,
  readonly "searchTitle": string,
  readonly "settings": string,
  readonly "viewMode": string
};
  (_: "header.allBooks", __?: {}): string;
  (_: "header.catalogs", __?: {}): string;
  (_: "header.downloads", __?: {}): string;
  (_: "header.fitlerTagTitle", __?: {}): string;
  (_: "header.gridTitle", __?: {}): string;
  (_: "header.home", __?: {}): string;
  (_: "header.homeTitle", __?: {}): string;
  (_: "header.importTitle", __?: {}): string;
  (_: "header.listTitle", __?: {}): string;
  (_: "header.myCatalogs", __?: {}): string;
  (_: "header.refreshTitle", __?: {}): string;
  (_: "header.searchPlaceholder", __?: {}): string;
  (_: "header.searchTitle", __?: {}): string;
  (_: "header.settings", __?: {}): string;
  (_: "header.viewMode", __?: {}): string;
  (_: "library", __?: {}): {
  readonly "lcp": {
    readonly "hint": string,
    readonly "open": string,
    readonly "password": string,
    readonly "sentence": string,
    readonly "urlHint": string,
    readonly "whatIsLcp?": string,
    readonly "whatIsLcpInfoDetails": string,
    readonly "whatIsLcpInfoDetailsLink": string
  }
};
  (_: "library.lcp", __?: {}): {
  readonly "hint": string,
  readonly "open": string,
  readonly "password": string,
  readonly "sentence": string,
  readonly "urlHint": string,
  readonly "whatIsLcp?": string,
  readonly "whatIsLcpInfoDetails": string,
  readonly "whatIsLcpInfoDetailsLink": string
};
  (_: "library.lcp.hint", __?: {}): string;
  (_: "library.lcp.open", __?: {}): string;
  (_: "library.lcp.password", __?: {}): string;
  (_: "library.lcp.sentence", __?: {}): string;
  (_: "library.lcp.urlHint", __?: {}): string;
  (_: "library.lcp.whatIsLcp?", __?: {}): string;
  (_: "library.lcp.whatIsLcpInfoDetails", __?: {}): string;
  (_: "library.lcp.whatIsLcpInfoDetailsLink", __?: {}): string;
  (_: "message", __?: {}): {
  readonly "annotations": {
    readonly "alreadyImported": string,
    readonly "emptyFile": string,
    readonly "errorParsing": string,
    readonly "noBelongTo": string,
    readonly "nothing": string,
    readonly "success": string
  },
  readonly "download": { readonly "error": string },
  readonly "import": {
    readonly "alreadyImport": string,
    readonly "fail": string,
    readonly "success": string
  },
  readonly "open": { readonly "error": string }
};
  (_: "message.annotations", __?: {}): {
  readonly "alreadyImported": string,
  readonly "emptyFile": string,
  readonly "errorParsing": string,
  readonly "noBelongTo": string,
  readonly "nothing": string,
  readonly "success": string
};
  (_: "message.annotations.alreadyImported", __?: {}): string;
  (_: "message.annotations.emptyFile", __?: {}): string;
  (_: "message.annotations.errorParsing", __?: {}): string;
  (_: "message.annotations.noBelongTo", __?: {}): string;
  (_: "message.annotations.nothing", __?: {}): string;
  (_: "message.annotations.success", __?: {}): string;
  (_: "message.download", __?: {}): { readonly "error": string };
  (_: "message.download.error", __?: {}): string;
  (_: "message.import", __?: {}): {
  readonly "alreadyImport": string,
  readonly "fail": string,
  readonly "success": string
};
  (_: "message.import.alreadyImport", __?: {}): string;
  (_: "message.import.fail", __?: {}): string;
  (_: "message.import.success", __?: {}): string;
  (_: "message.open", __?: {}): { readonly "error": string };
  (_: "message.open.error", __?: {}): string;
  (_: "opds", __?: {}): {
  readonly "resumeBrowsing": string,
  readonly "addForm": {
    readonly "addButton": string,
    readonly "name": string,
    readonly "namePlaceholder": string,
    readonly "url": string,
    readonly "urlPlaceholder": string
  },
  readonly "addFormApiapp": { readonly "title": string },
  readonly "addMenu": string,
  readonly "breadcrumbRoot": string,
  readonly "documentation": string,
  readonly "empty": string,
  readonly "firstPage": string,
  readonly "informations": string,
  readonly "lastPage": string,
  readonly "menu": {
    readonly "aboutBook": string,
    readonly "addExtract": string,
    readonly "goBuyBook": string,
    readonly "goLoanBook": string,
    readonly "goRevokeLoanBook": string,
    readonly "goSubBook": string
  },
  readonly "network": {
    readonly "error": string,
    readonly "noInternet": string,
    readonly "noInternetMessage": string,
    readonly "reject": string,
    readonly "timeout": string
  },
  readonly "next": string,
  readonly "previous": string,
  readonly "shelf": string,
  readonly "updateForm": {
    readonly "name": string,
    readonly "title": string,
    readonly "updateButton": string,
    readonly "url": string
  },
  readonly "whatIsOpds": string
};
  (_: "opds.resumeBrowsing", __?: {}): string;
  (_: "opds.addForm", __?: {}): {
  readonly "addButton": string,
  readonly "name": string,
  readonly "namePlaceholder": string,
  readonly "url": string,
  readonly "urlPlaceholder": string
};
  (_: "opds.addForm.addButton", __?: {}): string;
  (_: "opds.addForm.name", __?: {}): string;
  (_: "opds.addForm.namePlaceholder", __?: {}): string;
  (_: "opds.addForm.url", __?: {}): string;
  (_: "opds.addForm.urlPlaceholder", __?: {}): string;
  (_: "opds.addFormApiapp", __?: {}): { readonly "title": string };
  (_: "opds.addFormApiapp.title", __?: {}): string;
  (_: "opds.addMenu", __?: {}): string;
  (_: "opds.breadcrumbRoot", __?: {}): string;
  (_: "opds.documentation", __?: {}): string;
  (_: "opds.empty", __?: {}): string; (_: "opds.firstPage", __?: {}): string;
  (_: "opds.informations", __?: {}): string;
  (_: "opds.lastPage", __?: {}): string;
  (_: "opds.menu", __?: {}): {
  readonly "aboutBook": string,
  readonly "addExtract": string,
  readonly "goBuyBook": string,
  readonly "goLoanBook": string,
  readonly "goRevokeLoanBook": string,
  readonly "goSubBook": string
};
  (_: "opds.menu.aboutBook", __?: {}): string;
  (_: "opds.menu.addExtract", __?: {}): string;
  (_: "opds.menu.goBuyBook", __?: {}): string;
  (_: "opds.menu.goLoanBook", __?: {}): string;
  (_: "opds.menu.goRevokeLoanBook", __?: {}): string;
  (_: "opds.menu.goSubBook", __?: {}): string;
  (_: "opds.network", __?: {}): {
  readonly "error": string,
  readonly "noInternet": string,
  readonly "noInternetMessage": string,
  readonly "reject": string,
  readonly "timeout": string
};
  (_: "opds.network.error", __?: {}): string;
  (_: "opds.network.noInternet", __?: {}): string;
  (_: "opds.network.noInternetMessage", __?: {}): string;
  (_: "opds.network.reject", __?: {}): string;
  (_: "opds.network.timeout", __?: {}): string;
  (_: "opds.next", __?: {}): string; (_: "opds.previous", __?: {}): string;
  (_: "opds.shelf", __?: {}): string;
  (_: "opds.updateForm", __?: {}): {
  readonly "name": string,
  readonly "title": string,
  readonly "updateButton": string,
  readonly "url": string
};
  (_: "opds.updateForm.name", __?: {}): string;
  (_: "opds.updateForm.title", __?: {}): string;
  (_: "opds.updateForm.updateButton", __?: {}): string;
  (_: "opds.updateForm.url", __?: {}): string;
  (_: "opds.whatIsOpds", __?: {}): string;
  (_: "publ-a11y-display-guide", __?: {}): {
  readonly "accessibility-summary": {
    readonly "accessibility-summary-title": string
  },
  readonly "additional-accessibility-information": {
    readonly "additional-accessibility-information-aria": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "additional-accessibility-information-audio-descriptions": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "additional-accessibility-information-braille": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "additional-accessibility-information-full-ruby-annotations": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "additional-accessibility-information-high-contrast-between-foreground-and-background-audio": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "additional-accessibility-information-high-contrast-between-text-and-background": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "additional-accessibility-information-large-print": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "additional-accessibility-information-page-breaks": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "additional-accessibility-information-ruby-annotations": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "additional-accessibility-information-sign-language": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "additional-accessibility-information-tactile-graphics": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "additional-accessibility-information-tactile-objects": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "additional-accessibility-information-text-to-speech-hinting": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "additional-accessibility-information-title": string
  },
  readonly "conformance": {
    readonly "conformance-a": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "conformance-aa": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "conformance-aaa": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "conformance-certifier": { readonly "compact": string },
    readonly "conformance-certifier-credentials": {
      readonly "compact": string
    },
    readonly "conformance-details-certifier-report": {
      readonly "compact": string
    },
    readonly "conformance-details-claim": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "conformance-details-epub-accessibility-1-0": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "conformance-details-epub-accessibility-1-1": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "conformance-details-level-a": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "conformance-details-level-aa": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "conformance-details-level-aaa": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "conformance-details-wcag-2-0": { readonly "compact": string },
    readonly "conformance-details-wcag-2-1": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "conformance-details-wcag-2-2": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "conformance-no": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "conformance-title": string,
    readonly "conformance-unknown-standard": {
      readonly "compact": string,
      readonly "descriptive": string
    }
  },
  readonly "hazards": {
    readonly "hazards-flashing": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "hazards-flashing-none": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "hazards-flashing-unknown": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "hazards-motion": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "hazards-motion-none": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "hazards-motion-unknown": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "hazards-no-metadata": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "hazards-none": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "hazards-sound": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "hazards-sound-none": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "hazards-sound-unknown": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "hazards-title": string,
    readonly "hazards-unknown": {
      readonly "compact": string,
      readonly "descriptive": string
    }
  },
  readonly "navigation": {
    readonly "navigation-index": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "navigation-no-metadata": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "navigation-page-navigation": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "navigation-structural": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "navigation-title": string,
    readonly "navigation-toc": {
      readonly "compact": string,
      readonly "descriptive": string
    }
  },
  readonly "rich-content": {
    readonly "rich-content-accessible-chemistry-as-latex": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "rich-content-accessible-chemistry-as-mathml": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "rich-content-accessible-math-as-latex": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "rich-content-accessible-math-as-mathml": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "rich-content-accessible-math-described": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "rich-content-closed-captions": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "rich-content-extended": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "rich-content-open-captions": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "rich-content-title": string,
    readonly "rich-content-transcript": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "rich-content-unknown": {
      readonly "compact": string,
      readonly "descriptive": string
    }
  },
  readonly "ways-of-reading": {
    readonly "ways-of-reading-nonvisual-reading-alt-text": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "ways-of-reading-nonvisual-reading-no-metadata": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "ways-of-reading-nonvisual-reading-none": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "ways-of-reading-nonvisual-reading-not-fully": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "ways-of-reading-nonvisual-reading-readable": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "ways-of-reading-prerecorded-audio-complementary": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "ways-of-reading-prerecorded-audio-no-metadata": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "ways-of-reading-prerecorded-audio-only": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "ways-of-reading-prerecorded-audio-synchronized": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "ways-of-reading-title": string,
    readonly "ways-of-reading-visual-adjustments-modifiable": {
      readonly "compact": string,
      readonly "descriptive": string
    },
    readonly "ways-of-reading-visual-adjustments-unknown": {
      readonly "compact": string,
      readonly "descriptive": string
    }
  }
};
  (_: "publ-a11y-display-guide.accessibility-summary", __?: {}): { readonly "accessibility-summary-title": string };
  (_: "publ-a11y-display-guide.accessibility-summary.accessibility-summary-title", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information", __?: {}): {
  readonly "additional-accessibility-information-aria": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "additional-accessibility-information-audio-descriptions": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "additional-accessibility-information-braille": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "additional-accessibility-information-full-ruby-annotations": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "additional-accessibility-information-high-contrast-between-foreground-and-background-audio": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "additional-accessibility-information-high-contrast-between-text-and-background": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "additional-accessibility-information-large-print": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "additional-accessibility-information-page-breaks": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "additional-accessibility-information-ruby-annotations": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "additional-accessibility-information-sign-language": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "additional-accessibility-information-tactile-graphics": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "additional-accessibility-information-tactile-objects": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "additional-accessibility-information-text-to-speech-hinting": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "additional-accessibility-information-title": string
};
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-aria", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-aria.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-aria.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-audio-descriptions", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-audio-descriptions.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-audio-descriptions.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-braille", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-braille.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-braille.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-full-ruby-annotations", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-full-ruby-annotations.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-full-ruby-annotations.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-high-contrast-between-foreground-and-background-audio", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-high-contrast-between-foreground-and-background-audio.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-high-contrast-between-foreground-and-background-audio.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-high-contrast-between-text-and-background", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-high-contrast-between-text-and-background.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-high-contrast-between-text-and-background.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-large-print", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-large-print.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-large-print.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-page-breaks", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-page-breaks.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-page-breaks.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-ruby-annotations", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-ruby-annotations.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-ruby-annotations.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-sign-language", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-sign-language.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-sign-language.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-tactile-graphics", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-tactile-graphics.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-tactile-graphics.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-tactile-objects", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-tactile-objects.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-tactile-objects.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-text-to-speech-hinting", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-text-to-speech-hinting.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-text-to-speech-hinting.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.additional-accessibility-information.additional-accessibility-information-title", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance", __?: {}): {
  readonly "conformance-a": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "conformance-aa": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "conformance-aaa": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "conformance-certifier": { readonly "compact": string },
  readonly "conformance-certifier-credentials": {
    readonly "compact": string
  },
  readonly "conformance-details-certifier-report": {
    readonly "compact": string
  },
  readonly "conformance-details-claim": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "conformance-details-epub-accessibility-1-0": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "conformance-details-epub-accessibility-1-1": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "conformance-details-level-a": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "conformance-details-level-aa": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "conformance-details-level-aaa": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "conformance-details-wcag-2-0": { readonly "compact": string },
  readonly "conformance-details-wcag-2-1": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "conformance-details-wcag-2-2": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "conformance-no": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "conformance-title": string,
  readonly "conformance-unknown-standard": {
    readonly "compact": string,
    readonly "descriptive": string
  }
};
  (_: "publ-a11y-display-guide.conformance.conformance-a", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.conformance.conformance-a.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-a.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-aa", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.conformance.conformance-aa.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-aa.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-aaa", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.conformance.conformance-aaa.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-aaa.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-certifier", __?: {}): { readonly "compact": string };
  (_: "publ-a11y-display-guide.conformance.conformance-certifier.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-certifier-credentials", __?: {}): { readonly "compact": string };
  (_: "publ-a11y-display-guide.conformance.conformance-certifier-credentials.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-certifier-report", __?: {}): { readonly "compact": string };
  (_: "publ-a11y-display-guide.conformance.conformance-details-certifier-report.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-claim", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.conformance.conformance-details-claim.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-claim.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-epub-accessibility-1-0", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.conformance.conformance-details-epub-accessibility-1-0.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-epub-accessibility-1-0.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-epub-accessibility-1-1", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.conformance.conformance-details-epub-accessibility-1-1.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-epub-accessibility-1-1.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-level-a", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.conformance.conformance-details-level-a.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-level-a.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-level-aa", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.conformance.conformance-details-level-aa.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-level-aa.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-level-aaa", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.conformance.conformance-details-level-aaa.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-level-aaa.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-wcag-2-0", __?: {}): { readonly "compact": string };
  (_: "publ-a11y-display-guide.conformance.conformance-details-wcag-2-0.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-wcag-2-1", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.conformance.conformance-details-wcag-2-1.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-wcag-2-1.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-wcag-2-2", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.conformance.conformance-details-wcag-2-2.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-details-wcag-2-2.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-no", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.conformance.conformance-no.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-no.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-title", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-unknown-standard", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.conformance.conformance-unknown-standard.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.conformance.conformance-unknown-standard.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards", __?: {}): {
  readonly "hazards-flashing": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "hazards-flashing-none": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "hazards-flashing-unknown": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "hazards-motion": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "hazards-motion-none": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "hazards-motion-unknown": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "hazards-no-metadata": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "hazards-none": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "hazards-sound": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "hazards-sound-none": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "hazards-sound-unknown": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "hazards-title": string,
  readonly "hazards-unknown": {
    readonly "compact": string,
    readonly "descriptive": string
  }
};
  (_: "publ-a11y-display-guide.hazards.hazards-flashing", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.hazards.hazards-flashing.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-flashing.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-flashing-none", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.hazards.hazards-flashing-none.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-flashing-none.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-flashing-unknown", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.hazards.hazards-flashing-unknown.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-flashing-unknown.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-motion", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.hazards.hazards-motion.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-motion.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-motion-none", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.hazards.hazards-motion-none.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-motion-none.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-motion-unknown", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.hazards.hazards-motion-unknown.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-motion-unknown.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-no-metadata", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.hazards.hazards-no-metadata.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-no-metadata.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-none", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.hazards.hazards-none.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-none.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-sound", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.hazards.hazards-sound.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-sound.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-sound-none", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.hazards.hazards-sound-none.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-sound-none.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-sound-unknown", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.hazards.hazards-sound-unknown.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-sound-unknown.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-title", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-unknown", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.hazards.hazards-unknown.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.hazards.hazards-unknown.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.navigation", __?: {}): {
  readonly "navigation-index": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "navigation-no-metadata": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "navigation-page-navigation": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "navigation-structural": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "navigation-title": string,
  readonly "navigation-toc": {
    readonly "compact": string,
    readonly "descriptive": string
  }
};
  (_: "publ-a11y-display-guide.navigation.navigation-index", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.navigation.navigation-index.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.navigation.navigation-index.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.navigation.navigation-no-metadata", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.navigation.navigation-no-metadata.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.navigation.navigation-no-metadata.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.navigation.navigation-page-navigation", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.navigation.navigation-page-navigation.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.navigation.navigation-page-navigation.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.navigation.navigation-structural", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.navigation.navigation-structural.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.navigation.navigation-structural.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.navigation.navigation-title", __?: {}): string;
  (_: "publ-a11y-display-guide.navigation.navigation-toc", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.navigation.navigation-toc.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.navigation.navigation-toc.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content", __?: {}): {
  readonly "rich-content-accessible-chemistry-as-latex": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "rich-content-accessible-chemistry-as-mathml": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "rich-content-accessible-math-as-latex": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "rich-content-accessible-math-as-mathml": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "rich-content-accessible-math-described": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "rich-content-closed-captions": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "rich-content-extended": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "rich-content-open-captions": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "rich-content-title": string,
  readonly "rich-content-transcript": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "rich-content-unknown": {
    readonly "compact": string,
    readonly "descriptive": string
  }
};
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-chemistry-as-latex", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-chemistry-as-latex.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-chemistry-as-latex.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-chemistry-as-mathml", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-chemistry-as-mathml.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-chemistry-as-mathml.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-math-as-latex", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-math-as-latex.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-math-as-latex.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-math-as-mathml", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-math-as-mathml.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-math-as-mathml.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-math-described", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-math-described.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-accessible-math-described.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-closed-captions", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.rich-content.rich-content-closed-captions.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-closed-captions.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-extended", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.rich-content.rich-content-extended.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-extended.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-open-captions", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.rich-content.rich-content-open-captions.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-open-captions.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-title", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-transcript", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.rich-content.rich-content-transcript.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-transcript.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-unknown", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.rich-content.rich-content-unknown.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.rich-content.rich-content-unknown.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading", __?: {}): {
  readonly "ways-of-reading-nonvisual-reading-alt-text": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "ways-of-reading-nonvisual-reading-no-metadata": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "ways-of-reading-nonvisual-reading-none": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "ways-of-reading-nonvisual-reading-not-fully": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "ways-of-reading-nonvisual-reading-readable": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "ways-of-reading-prerecorded-audio-complementary": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "ways-of-reading-prerecorded-audio-no-metadata": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "ways-of-reading-prerecorded-audio-only": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "ways-of-reading-prerecorded-audio-synchronized": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "ways-of-reading-title": string,
  readonly "ways-of-reading-visual-adjustments-modifiable": {
    readonly "compact": string,
    readonly "descriptive": string
  },
  readonly "ways-of-reading-visual-adjustments-unknown": {
    readonly "compact": string,
    readonly "descriptive": string
  }
};
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-alt-text", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-alt-text.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-alt-text.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-no-metadata", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-no-metadata.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-no-metadata.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-none", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-none.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-none.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-not-fully", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-not-fully.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-not-fully.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-readable", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-readable.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-nonvisual-reading-readable.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-complementary", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-complementary.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-complementary.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-no-metadata", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-no-metadata.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-no-metadata.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-only", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-only.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-only.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-synchronized", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-synchronized.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-prerecorded-audio-synchronized.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-title", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-visual-adjustments-modifiable", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-visual-adjustments-modifiable.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-visual-adjustments-modifiable.descriptive", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-visual-adjustments-unknown", __?: {}): { readonly "compact": string, readonly "descriptive": string };
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-visual-adjustments-unknown.compact", __?: {}): string;
  (_: "publ-a11y-display-guide.ways-of-reading.ways-of-reading-visual-adjustments-unknown.descriptive", __?: {}): string;
  (_: "publication", __?: {}): {
  readonly "accessibility": {
    readonly "accessModeSufficient": { readonly "textual": string },
    readonly "accessibilityFeature": {
      readonly "alternativeText": string,
      readonly "displayTransformability": string,
      readonly "longDescription": string,
      readonly "printPageNumbers": string,
      readonly "readingOrder": string,
      readonly "synchronizedAudioText": string,
      readonly "tableOfContents": string
    },
    readonly "accessibilityHazard": {
      readonly "flashing": string,
      readonly "motionSimulation": string,
      readonly "name": string,
      readonly "noFlashing": string,
      readonly "noMotionSimulation": string,
      readonly "noSound": string,
      readonly "none": string,
      readonly "sound": string,
      readonly "unknown": string
    },
    readonly "certifierReport": string,
    readonly "conformsTo": string,
    readonly "moreInformation": string,
    readonly "name": string,
    readonly "noA11y": string
  },
  readonly "actions": string,
  readonly "audio": { readonly "tracks": string },
  readonly "author": string,
  readonly "cancelledLcp": string,
  readonly "certificateRevoked": string,
  readonly "certificateSignatureInvalid": string,
  readonly "cover": { readonly "img": string },
  readonly "day": string,
  readonly "days": string,
  readonly "duration": { readonly "title": string },
  readonly "encryptedNoLicense": string,
  readonly "expired": string,
  readonly "expiredLcp": string,
  readonly "incorrectPassphrase": string,
  readonly "lcpEnd": string,
  readonly "lcpRightsCopy": string,
  readonly "lcpRightsPrint": string,
  readonly "lcpStart": string,
  readonly "licenceLCP": string,
  readonly "licenseCertificateDateInvalid": string,
  readonly "licenseOutOfDate": string,
  readonly "licenseSignatureInvalid": string,
  readonly "licensed": string,
  readonly "markAsRead": string,
  readonly "notStarted": string,
  readonly "onGoing": string,
  readonly "progression": { readonly "title": string },
  readonly "read": string,
  readonly "remainingTime": string,
  readonly "renewButton": string,
  readonly "returnButton": string,
  readonly "returnedLcp": string,
  readonly "revokedLcp": string,
  readonly "seeLess": string,
  readonly "seeMore": string,
  readonly "timeLeft": string,
  readonly "title": string,
  readonly "userKeyCheckInvalid": string
};
  (_: "publication.accessibility", __?: {}): {
  readonly "accessModeSufficient": { readonly "textual": string },
  readonly "accessibilityFeature": {
    readonly "alternativeText": string,
    readonly "displayTransformability": string,
    readonly "longDescription": string,
    readonly "printPageNumbers": string,
    readonly "readingOrder": string,
    readonly "synchronizedAudioText": string,
    readonly "tableOfContents": string
  },
  readonly "accessibilityHazard": {
    readonly "flashing": string,
    readonly "motionSimulation": string,
    readonly "name": string,
    readonly "noFlashing": string,
    readonly "noMotionSimulation": string,
    readonly "noSound": string,
    readonly "none": string,
    readonly "sound": string,
    readonly "unknown": string
  },
  readonly "certifierReport": string,
  readonly "conformsTo": string,
  readonly "moreInformation": string,
  readonly "name": string,
  readonly "noA11y": string
};
  (_: "publication.accessibility.accessModeSufficient", __?: {}): { readonly "textual": string };
  (_: "publication.accessibility.accessModeSufficient.textual", __?: {}): string;
  (_: "publication.accessibility.accessibilityFeature", __?: {}): {
  readonly "alternativeText": string,
  readonly "displayTransformability": string,
  readonly "longDescription": string,
  readonly "printPageNumbers": string,
  readonly "readingOrder": string,
  readonly "synchronizedAudioText": string,
  readonly "tableOfContents": string
};
  (_: "publication.accessibility.accessibilityFeature.alternativeText", __?: {}): string;
  (_: "publication.accessibility.accessibilityFeature.displayTransformability", __?: {}): string;
  (_: "publication.accessibility.accessibilityFeature.longDescription", __?: {}): string;
  (_: "publication.accessibility.accessibilityFeature.printPageNumbers", __?: {}): string;
  (_: "publication.accessibility.accessibilityFeature.readingOrder", __?: {}): string;
  (_: "publication.accessibility.accessibilityFeature.synchronizedAudioText", __?: {}): string;
  (_: "publication.accessibility.accessibilityFeature.tableOfContents", __?: {}): string;
  (_: "publication.accessibility.accessibilityHazard", __?: {}): {
  readonly "flashing": string,
  readonly "motionSimulation": string,
  readonly "name": string,
  readonly "noFlashing": string,
  readonly "noMotionSimulation": string,
  readonly "noSound": string,
  readonly "none": string,
  readonly "sound": string,
  readonly "unknown": string
};
  (_: "publication.accessibility.accessibilityHazard.flashing", __?: {}): string;
  (_: "publication.accessibility.accessibilityHazard.motionSimulation", __?: {}): string;
  (_: "publication.accessibility.accessibilityHazard.name", __?: {}): string;
  (_: "publication.accessibility.accessibilityHazard.noFlashing", __?: {}): string;
  (_: "publication.accessibility.accessibilityHazard.noMotionSimulation", __?: {}): string;
  (_: "publication.accessibility.accessibilityHazard.noSound", __?: {}): string;
  (_: "publication.accessibility.accessibilityHazard.none", __?: {}): string;
  (_: "publication.accessibility.accessibilityHazard.sound", __?: {}): string;
  (_: "publication.accessibility.accessibilityHazard.unknown", __?: {}): string;
  (_: "publication.accessibility.certifierReport", __?: {}): string;
  (_: "publication.accessibility.conformsTo", __?: {}): string;
  (_: "publication.accessibility.moreInformation", __?: {}): string;
  (_: "publication.accessibility.name", __?: {}): string;
  (_: "publication.accessibility.noA11y", __?: {}): string;
  (_: "publication.actions", __?: {}): string;
  (_: "publication.audio", __?: {}): { readonly "tracks": string };
  (_: "publication.audio.tracks", __?: {}): string;
  (_: "publication.author", __?: {}): string;
  (_: "publication.cancelledLcp", __?: {}): string;
  (_: "publication.certificateRevoked", __?: {}): string;
  (_: "publication.certificateSignatureInvalid", __?: {}): string;
  (_: "publication.cover", __?: {}): { readonly "img": string };
  (_: "publication.cover.img", __?: {}): string;
  (_: "publication.day", __?: {}): string;
  (_: "publication.days", __?: {}): string;
  (_: "publication.duration", __?: {}): { readonly "title": string };
  (_: "publication.duration.title", __?: {}): string;
  (_: "publication.encryptedNoLicense", __?: {}): string;
  (_: "publication.expired", __?: {}): string;
  (_: "publication.expiredLcp", __?: {}): string;
  (_: "publication.incorrectPassphrase", __?: {}): string;
  (_: "publication.lcpEnd", __?: {}): string;
  (_: "publication.lcpRightsCopy", __?: {}): string;
  (_: "publication.lcpRightsPrint", __?: {}): string;
  (_: "publication.lcpStart", __?: {}): string;
  (_: "publication.licenceLCP", __?: {}): string;
  (_: "publication.licenseCertificateDateInvalid", __?: {}): string;
  (_: "publication.licenseOutOfDate", __?: {}): string;
  (_: "publication.licenseSignatureInvalid", __?: {}): string;
  (_: "publication.licensed", __?: {}): string;
  (_: "publication.markAsRead", __?: {}): string;
  (_: "publication.notStarted", __?: {}): string;
  (_: "publication.onGoing", __?: {}): string;
  (_: "publication.progression", __?: {}): { readonly "title": string };
  (_: "publication.progression.title", __?: {}): string;
  (_: "publication.read", __?: {}): string;
  (_: "publication.remainingTime", __?: {}): string;
  (_: "publication.renewButton", __?: {}): string;
  (_: "publication.returnButton", __?: {}): string;
  (_: "publication.returnedLcp", __?: {}): string;
  (_: "publication.revokedLcp", __?: {}): string;
  (_: "publication.seeLess", __?: {}): string;
  (_: "publication.seeMore", __?: {}): string;
  (_: "publication.timeLeft", __?: {}): string;
  (_: "publication.title", __?: {}): string;
  (_: "publication.userKeyCheckInvalid", __?: {}): string;
  (_: "reader", __?: {}): {
  readonly "annotations": {
    readonly "Color": string,
    readonly "addNote": string,
    readonly "advancedMode": string,
    readonly "annotationsExport": {
      readonly "description": string,
      readonly "title": string
    },
    readonly "annotationsOptions": string,
    readonly "date": string,
    readonly "export": string,
    readonly "filter": {
      readonly "all": string,
      readonly "filterByColor": string,
      readonly "filterByCreator": string,
      readonly "filterByDrawtype": string,
      readonly "filterByTag": string,
      readonly "filterOptions": string,
      readonly "none": string
    },
    readonly "hide": string,
    readonly "highlight": string,
    readonly "noSelectionToast": string,
    readonly "note": string,
    readonly "quickAnnotations": string,
    readonly "saveNote": string,
    readonly "sorting": {
      readonly "lastcreated": string,
      readonly "lastmodified": string,
      readonly "progression": string,
      readonly "sortingOptions": string
    },
    readonly "toggleMarginMarks": string,
    readonly "type": {
      readonly "outline": string,
      readonly "solid": string,
      readonly "strikethrough": string,
      readonly "underline": string
    }
  },
  readonly "bookmarks": { readonly "index": string },
  readonly "divina": { readonly "mute": string, readonly "unmute": string },
  readonly "fxl": { readonly "fit": string },
  readonly "goToContent": string,
  readonly "imgViewer": {
    readonly "title": string,
    readonly "zoomIn": string,
    readonly "zoomOut": string,
    readonly "zoomReset": string
  },
  readonly "marks": {
    readonly "annotations": string,
    readonly "bookmarks": string,
    readonly "delete": string,
    readonly "edit": string,
    readonly "goTo": string,
    readonly "landmarks": string,
    readonly "saveMark": string,
    readonly "search": string,
    readonly "searchResult": string,
    readonly "toc": string
  },
  readonly "media-overlays": {
    readonly "activate": string,
    readonly "captions": string,
    readonly "captionsDescription": string,
    readonly "disableContinuousPlay": string,
    readonly "disableContinuousPlayDescription": string,
    readonly "ignoreAndUseTTS": string,
    readonly "ignoreAndUseTTSDescription": string,
    readonly "next": string,
    readonly "pause": string,
    readonly "play": string,
    readonly "previous": string,
    readonly "skip": string,
    readonly "skipDescription": string,
    readonly "speed": string,
    readonly "stop": string,
    readonly "title": string
  },
  readonly "navigation": {
    readonly "ZenModeExit": string,
    readonly "ZenModeTitle": string,
    readonly "annotationTitle": string,
    readonly "backHomeTitle": string,
    readonly "bookmarkTitle": string,
    readonly "currentPage": string,
    readonly "currentPageTotal": string,
    readonly "detachWindowTitle": string,
    readonly "goTo": string,
    readonly "goToError": string,
    readonly "goToPlaceHolder": string,
    readonly "goToTitle": string,
    readonly "history": string,
    readonly "historyNext": string,
    readonly "historyPrevious": string,
    readonly "infoTitle": string,
    readonly "magnifyingGlassButton": string,
    readonly "openTableOfContentsTitle": string,
    readonly "page": string,
    readonly "pdfscalemode": string,
    readonly "print": string,
    readonly "printDisabled": string,
    readonly "screenNext": string,
    readonly "screenPrevious": string,
    readonly "settingsTitle": string
  },
  readonly "notes": {
    readonly "colors": {
      readonly "cyan": string,
      readonly "green": string,
      readonly "orange": string,
      readonly "purple": string,
      readonly "red": string,
      readonly "yellow": string
    }
  },
  readonly "picker": {
    readonly "search": {
      readonly "founds": string,
      readonly "input": string,
      readonly "next": string,
      readonly "notFound": string,
      readonly "previous": string,
      readonly "results": string,
      readonly "submit": string
    },
    readonly "searchTitle": string
  },
  readonly "print": {
    readonly "descriptionLcpCount": string,
    readonly "descriptionLcpPrintable": string,
    readonly "howTo": string,
    readonly "lcpInfo": string,
    readonly "noPagesLcpLimitReached": string,
    readonly "noPrintablePages": string,
    readonly "pageHelpInfo": string,
    readonly "pageHelpInfo1": string,
    readonly "pageHelpInfo2": string,
    readonly "pageHelpInfo3": string,
    readonly "pageHelpInfo4": string,
    readonly "pages": string,
    readonly "preview": string,
    readonly "print": string,
    readonly "printablePages": string,
    readonly "title": string
  },
  readonly "settings": {
    readonly "column": {
      readonly "auto": string,
      readonly "one": string,
      readonly "title": string,
      readonly "two": string
    },
    readonly "customFontSelected": string,
    readonly "customizeReader": string,
    readonly "disabled": string,
    readonly "display": string,
    readonly "disposition": { readonly "title": string },
    readonly "font": string,
    readonly "fontSize": string,
    readonly "infoCustomFont": string,
    readonly "justification": string,
    readonly "justify": string,
    readonly "letterSpacing": string,
    readonly "lineSpacing": string,
    readonly "margin": string,
    readonly "mathjax": string,
    readonly "noFootnotes": string,
    readonly "noRTLFlip": string,
    readonly "noRuby": string,
    readonly "noTemporaryNavTargetOutline": string,
    readonly "paginated": string,
    readonly "paraSpacing": string,
    readonly "pdfZoom": {
      readonly "name": {
        readonly "100pct": string,
        readonly "150pct": string,
        readonly "200pct": string,
        readonly "300pct": string,
        readonly "500pct": string,
        readonly "50pct": string,
        readonly "fit": string,
        readonly "width": string
      },
      readonly "title": string
    },
    readonly "preset": {
      readonly "apply": string,
      readonly "applyDetails": string,
      readonly "detail": string,
      readonly "reset": string,
      readonly "resetDetails": string,
      readonly "save": string,
      readonly "saveDetails": string,
      readonly "title": string
    },
    readonly "preview": string,
    readonly "reduceMotion": string,
    readonly "scrolled": string,
    readonly "spacing": string,
    readonly "text": string,
    readonly "theme": {
      readonly "name": {
        readonly "Contrast1": string,
        readonly "Contrast2": string,
        readonly "Contrast3": string,
        readonly "Contrast4": string,
        readonly "Neutral": string,
        readonly "Night": string,
        readonly "Paper": string,
        readonly "Sepia": string
      },
      readonly "title": string
    },
    readonly "wordSpacing": string
  },
  readonly "svg": { readonly "left": string, readonly "right": string },
  readonly "toc": { readonly "publicationNoToc": string },
  readonly "tts": {
    readonly "activate": string,
    readonly "language": string,
    readonly "next": string,
    readonly "options": string,
    readonly "pause": string,
    readonly "play": string,
    readonly "previous": string,
    readonly "sentenceDetect": string,
    readonly "sentenceDetectDescription": string,
    readonly "speed": string,
    readonly "stop": string,
    readonly "voice": string
  }
};
  (_: "reader.annotations", __?: {}): {
  readonly "Color": string,
  readonly "addNote": string,
  readonly "advancedMode": string,
  readonly "annotationsExport": {
    readonly "description": string,
    readonly "title": string
  },
  readonly "annotationsOptions": string,
  readonly "date": string,
  readonly "export": string,
  readonly "filter": {
    readonly "all": string,
    readonly "filterByColor": string,
    readonly "filterByCreator": string,
    readonly "filterByDrawtype": string,
    readonly "filterByTag": string,
    readonly "filterOptions": string,
    readonly "none": string
  },
  readonly "hide": string,
  readonly "highlight": string,
  readonly "noSelectionToast": string,
  readonly "note": string,
  readonly "quickAnnotations": string,
  readonly "saveNote": string,
  readonly "sorting": {
    readonly "lastcreated": string,
    readonly "lastmodified": string,
    readonly "progression": string,
    readonly "sortingOptions": string
  },
  readonly "toggleMarginMarks": string,
  readonly "type": {
    readonly "outline": string,
    readonly "solid": string,
    readonly "strikethrough": string,
    readonly "underline": string
  }
};
  (_: "reader.annotations.Color", __?: {}): string;
  (_: "reader.annotations.addNote", __?: {}): string;
  (_: "reader.annotations.advancedMode", __?: {}): string;
  (_: "reader.annotations.annotationsExport", __?: {}): { readonly "description": string, readonly "title": string };
  (_: "reader.annotations.annotationsExport.description", __?: {}): string;
  (_: "reader.annotations.annotationsExport.title", __?: {}): string;
  (_: "reader.annotations.annotationsOptions", __?: {}): string;
  (_: "reader.annotations.date", __?: {}): string;
  (_: "reader.annotations.export", __?: {}): string;
  (_: "reader.annotations.filter", __?: {}): {
  readonly "all": string,
  readonly "filterByColor": string,
  readonly "filterByCreator": string,
  readonly "filterByDrawtype": string,
  readonly "filterByTag": string,
  readonly "filterOptions": string,
  readonly "none": string
};
  (_: "reader.annotations.filter.all", __?: {}): string;
  (_: "reader.annotations.filter.filterByColor", __?: {}): string;
  (_: "reader.annotations.filter.filterByCreator", __?: {}): string;
  (_: "reader.annotations.filter.filterByDrawtype", __?: {}): string;
  (_: "reader.annotations.filter.filterByTag", __?: {}): string;
  (_: "reader.annotations.filter.filterOptions", __?: {}): string;
  (_: "reader.annotations.filter.none", __?: {}): string;
  (_: "reader.annotations.hide", __?: {}): string;
  (_: "reader.annotations.highlight", __?: {}): string;
  (_: "reader.annotations.noSelectionToast", __?: {}): string;
  (_: "reader.annotations.note", __?: {}): string;
  (_: "reader.annotations.quickAnnotations", __?: {}): string;
  (_: "reader.annotations.saveNote", __?: {}): string;
  (_: "reader.annotations.sorting", __?: {}): {
  readonly "lastcreated": string,
  readonly "lastmodified": string,
  readonly "progression": string,
  readonly "sortingOptions": string
};
  (_: "reader.annotations.sorting.lastcreated", __?: {}): string;
  (_: "reader.annotations.sorting.lastmodified", __?: {}): string;
  (_: "reader.annotations.sorting.progression", __?: {}): string;
  (_: "reader.annotations.sorting.sortingOptions", __?: {}): string;
  (_: "reader.annotations.toggleMarginMarks", __?: {}): string;
  (_: "reader.annotations.type", __?: {}): {
  readonly "outline": string,
  readonly "solid": string,
  readonly "strikethrough": string,
  readonly "underline": string
};
  (_: "reader.annotations.type.outline", __?: {}): string;
  (_: "reader.annotations.type.solid", __?: {}): string;
  (_: "reader.annotations.type.strikethrough", __?: {}): string;
  (_: "reader.annotations.type.underline", __?: {}): string;
  (_: "reader.bookmarks", __?: {}): { readonly "index": string };
  (_: "reader.bookmarks.index", __?: {}): string;
  (_: "reader.divina", __?: {}): { readonly "mute": string, readonly "unmute": string };
  (_: "reader.divina.mute", __?: {}): string;
  (_: "reader.divina.unmute", __?: {}): string;
  (_: "reader.fxl", __?: {}): { readonly "fit": string };
  (_: "reader.fxl.fit", __?: {}): string;
  (_: "reader.goToContent", __?: {}): string;
  (_: "reader.imgViewer", __?: {}): {
  readonly "title": string,
  readonly "zoomIn": string,
  readonly "zoomOut": string,
  readonly "zoomReset": string
};
  (_: "reader.imgViewer.title", __?: {}): string;
  (_: "reader.imgViewer.zoomIn", __?: {}): string;
  (_: "reader.imgViewer.zoomOut", __?: {}): string;
  (_: "reader.imgViewer.zoomReset", __?: {}): string;
  (_: "reader.marks", __?: {}): {
  readonly "annotations": string,
  readonly "bookmarks": string,
  readonly "delete": string,
  readonly "edit": string,
  readonly "goTo": string,
  readonly "landmarks": string,
  readonly "saveMark": string,
  readonly "search": string,
  readonly "searchResult": string,
  readonly "toc": string
};
  (_: "reader.marks.annotations", __?: {}): string;
  (_: "reader.marks.bookmarks", __?: {}): string;
  (_: "reader.marks.delete", __?: {}): string;
  (_: "reader.marks.edit", __?: {}): string;
  (_: "reader.marks.goTo", __?: {}): string;
  (_: "reader.marks.landmarks", __?: {}): string;
  (_: "reader.marks.saveMark", __?: {}): string;
  (_: "reader.marks.search", __?: {}): string;
  (_: "reader.marks.searchResult", __?: {}): string;
  (_: "reader.marks.toc", __?: {}): string;
  (_: "reader.media-overlays", __?: {}): {
  readonly "activate": string,
  readonly "captions": string,
  readonly "captionsDescription": string,
  readonly "disableContinuousPlay": string,
  readonly "disableContinuousPlayDescription": string,
  readonly "ignoreAndUseTTS": string,
  readonly "ignoreAndUseTTSDescription": string,
  readonly "next": string,
  readonly "pause": string,
  readonly "play": string,
  readonly "previous": string,
  readonly "skip": string,
  readonly "skipDescription": string,
  readonly "speed": string,
  readonly "stop": string,
  readonly "title": string
};
  (_: "reader.media-overlays.activate", __?: {}): string;
  (_: "reader.media-overlays.captions", __?: {}): string;
  (_: "reader.media-overlays.captionsDescription", __?: {}): string;
  (_: "reader.media-overlays.disableContinuousPlay", __?: {}): string;
  (_: "reader.media-overlays.disableContinuousPlayDescription", __?: {}): string;
  (_: "reader.media-overlays.ignoreAndUseTTS", __?: {}): string;
  (_: "reader.media-overlays.ignoreAndUseTTSDescription", __?: {}): string;
  (_: "reader.media-overlays.next", __?: {}): string;
  (_: "reader.media-overlays.pause", __?: {}): string;
  (_: "reader.media-overlays.play", __?: {}): string;
  (_: "reader.media-overlays.previous", __?: {}): string;
  (_: "reader.media-overlays.skip", __?: {}): string;
  (_: "reader.media-overlays.skipDescription", __?: {}): string;
  (_: "reader.media-overlays.speed", __?: {}): string;
  (_: "reader.media-overlays.stop", __?: {}): string;
  (_: "reader.media-overlays.title", __?: {}): string;
  (_: "reader.navigation", __?: {}): {
  readonly "ZenModeExit": string,
  readonly "ZenModeTitle": string,
  readonly "annotationTitle": string,
  readonly "backHomeTitle": string,
  readonly "bookmarkTitle": string,
  readonly "currentPage": string,
  readonly "currentPageTotal": string,
  readonly "detachWindowTitle": string,
  readonly "goTo": string,
  readonly "goToError": string,
  readonly "goToPlaceHolder": string,
  readonly "goToTitle": string,
  readonly "history": string,
  readonly "historyNext": string,
  readonly "historyPrevious": string,
  readonly "infoTitle": string,
  readonly "magnifyingGlassButton": string,
  readonly "openTableOfContentsTitle": string,
  readonly "page": string,
  readonly "pdfscalemode": string,
  readonly "print": string,
  readonly "printDisabled": string,
  readonly "screenNext": string,
  readonly "screenPrevious": string,
  readonly "settingsTitle": string
};
  (_: "reader.navigation.ZenModeExit", __?: {}): string;
  (_: "reader.navigation.ZenModeTitle", __?: {}): string;
  (_: "reader.navigation.annotationTitle", __?: {}): string;
  (_: "reader.navigation.backHomeTitle", __?: {}): string;
  (_: "reader.navigation.bookmarkTitle", __?: {}): string;
  (_: "reader.navigation.currentPage", __?: {}): string;
  (_: "reader.navigation.currentPageTotal", __?: {}): string;
  (_: "reader.navigation.detachWindowTitle", __?: {}): string;
  (_: "reader.navigation.goTo", __?: {}): string;
  (_: "reader.navigation.goToError", __?: {}): string;
  (_: "reader.navigation.goToPlaceHolder", __?: {}): string;
  (_: "reader.navigation.goToTitle", __?: {}): string;
  (_: "reader.navigation.history", __?: {}): string;
  (_: "reader.navigation.historyNext", __?: {}): string;
  (_: "reader.navigation.historyPrevious", __?: {}): string;
  (_: "reader.navigation.infoTitle", __?: {}): string;
  (_: "reader.navigation.magnifyingGlassButton", __?: {}): string;
  (_: "reader.navigation.openTableOfContentsTitle", __?: {}): string;
  (_: "reader.navigation.page", __?: {}): string;
  (_: "reader.navigation.pdfscalemode", __?: {}): string;
  (_: "reader.navigation.print", __?: {}): string;
  (_: "reader.navigation.printDisabled", __?: {}): string;
  (_: "reader.navigation.screenNext", __?: {}): string;
  (_: "reader.navigation.screenPrevious", __?: {}): string;
  (_: "reader.navigation.settingsTitle", __?: {}): string;
  (_: "reader.notes", __?: {}): {
  readonly "colors": {
    readonly "cyan": string,
    readonly "green": string,
    readonly "orange": string,
    readonly "purple": string,
    readonly "red": string,
    readonly "yellow": string
  }
};
  (_: "reader.notes.colors", __?: {}): {
  readonly "cyan": string,
  readonly "green": string,
  readonly "orange": string,
  readonly "purple": string,
  readonly "red": string,
  readonly "yellow": string
};
  (_: "reader.notes.colors.cyan", __?: {}): string;
  (_: "reader.notes.colors.green", __?: {}): string;
  (_: "reader.notes.colors.orange", __?: {}): string;
  (_: "reader.notes.colors.purple", __?: {}): string;
  (_: "reader.notes.colors.red", __?: {}): string;
  (_: "reader.notes.colors.yellow", __?: {}): string;
  (_: "reader.picker", __?: {}): {
  readonly "search": {
    readonly "founds": string,
    readonly "input": string,
    readonly "next": string,
    readonly "notFound": string,
    readonly "previous": string,
    readonly "results": string,
    readonly "submit": string
  },
  readonly "searchTitle": string
};
  (_: "reader.picker.search", __?: {}): {
  readonly "founds": string,
  readonly "input": string,
  readonly "next": string,
  readonly "notFound": string,
  readonly "previous": string,
  readonly "results": string,
  readonly "submit": string
};
  (_: "reader.picker.search.founds", __?: {}): string;
  (_: "reader.picker.search.input", __?: {}): string;
  (_: "reader.picker.search.next", __?: {}): string;
  (_: "reader.picker.search.notFound", __?: {}): string;
  (_: "reader.picker.search.previous", __?: {}): string;
  (_: "reader.picker.search.results", __?: {}): string;
  (_: "reader.picker.search.submit", __?: {}): string;
  (_: "reader.picker.searchTitle", __?: {}): string;
  (_: "reader.print", __?: {}): {
  readonly "descriptionLcpCount": string,
  readonly "descriptionLcpPrintable": string,
  readonly "howTo": string,
  readonly "lcpInfo": string,
  readonly "noPagesLcpLimitReached": string,
  readonly "noPrintablePages": string,
  readonly "pageHelpInfo": string,
  readonly "pageHelpInfo1": string,
  readonly "pageHelpInfo2": string,
  readonly "pageHelpInfo3": string,
  readonly "pageHelpInfo4": string,
  readonly "pages": string,
  readonly "preview": string,
  readonly "print": string,
  readonly "printablePages": string,
  readonly "title": string
};
  (_: "reader.print.descriptionLcpCount", __?: {}): string;
  (_: "reader.print.descriptionLcpPrintable", __?: {}): string;
  (_: "reader.print.howTo", __?: {}): string;
  (_: "reader.print.lcpInfo", __?: {}): string;
  (_: "reader.print.noPagesLcpLimitReached", __?: {}): string;
  (_: "reader.print.noPrintablePages", __?: {}): string;
  (_: "reader.print.pageHelpInfo", __?: {}): string;
  (_: "reader.print.pageHelpInfo1", __?: {}): string;
  (_: "reader.print.pageHelpInfo2", __?: {}): string;
  (_: "reader.print.pageHelpInfo3", __?: {}): string;
  (_: "reader.print.pageHelpInfo4", __?: {}): string;
  (_: "reader.print.pages", __?: {}): string;
  (_: "reader.print.preview", __?: {}): string;
  (_: "reader.print.print", __?: {}): string;
  (_: "reader.print.printablePages", __?: {}): string;
  (_: "reader.print.title", __?: {}): string;
  (_: "reader.settings", __?: {}): {
  readonly "column": {
    readonly "auto": string,
    readonly "one": string,
    readonly "title": string,
    readonly "two": string
  },
  readonly "customFontSelected": string,
  readonly "customizeReader": string,
  readonly "disabled": string,
  readonly "display": string,
  readonly "disposition": { readonly "title": string },
  readonly "font": string,
  readonly "fontSize": string,
  readonly "infoCustomFont": string,
  readonly "justification": string,
  readonly "justify": string,
  readonly "letterSpacing": string,
  readonly "lineSpacing": string,
  readonly "margin": string,
  readonly "mathjax": string,
  readonly "noFootnotes": string,
  readonly "noRTLFlip": string,
  readonly "noRuby": string,
  readonly "noTemporaryNavTargetOutline": string,
  readonly "paginated": string,
  readonly "paraSpacing": string,
  readonly "pdfZoom": {
    readonly "name": {
      readonly "100pct": string,
      readonly "150pct": string,
      readonly "200pct": string,
      readonly "300pct": string,
      readonly "500pct": string,
      readonly "50pct": string,
      readonly "fit": string,
      readonly "width": string
    },
    readonly "title": string
  },
  readonly "preset": {
    readonly "apply": string,
    readonly "applyDetails": string,
    readonly "detail": string,
    readonly "reset": string,
    readonly "resetDetails": string,
    readonly "save": string,
    readonly "saveDetails": string,
    readonly "title": string
  },
  readonly "preview": string,
  readonly "reduceMotion": string,
  readonly "scrolled": string,
  readonly "spacing": string,
  readonly "text": string,
  readonly "theme": {
    readonly "name": {
      readonly "Contrast1": string,
      readonly "Contrast2": string,
      readonly "Contrast3": string,
      readonly "Contrast4": string,
      readonly "Neutral": string,
      readonly "Night": string,
      readonly "Paper": string,
      readonly "Sepia": string
    },
    readonly "title": string
  },
  readonly "wordSpacing": string
};
  (_: "reader.settings.column", __?: {}): {
  readonly "auto": string,
  readonly "one": string,
  readonly "title": string,
  readonly "two": string
};
  (_: "reader.settings.column.auto", __?: {}): string;
  (_: "reader.settings.column.one", __?: {}): string;
  (_: "reader.settings.column.title", __?: {}): string;
  (_: "reader.settings.column.two", __?: {}): string;
  (_: "reader.settings.customFontSelected", __?: {}): string;
  (_: "reader.settings.customizeReader", __?: {}): string;
  (_: "reader.settings.disabled", __?: {}): string;
  (_: "reader.settings.display", __?: {}): string;
  (_: "reader.settings.disposition", __?: {}): { readonly "title": string };
  (_: "reader.settings.disposition.title", __?: {}): string;
  (_: "reader.settings.font", __?: {}): string;
  (_: "reader.settings.fontSize", __?: {}): string;
  (_: "reader.settings.infoCustomFont", __?: {}): string;
  (_: "reader.settings.justification", __?: {}): string;
  (_: "reader.settings.justify", __?: {}): string;
  (_: "reader.settings.letterSpacing", __?: {}): string;
  (_: "reader.settings.lineSpacing", __?: {}): string;
  (_: "reader.settings.margin", __?: {}): string;
  (_: "reader.settings.mathjax", __?: {}): string;
  (_: "reader.settings.noFootnotes", __?: {}): string;
  (_: "reader.settings.noRTLFlip", __?: {}): string;
  (_: "reader.settings.noRuby", __?: {}): string;
  (_: "reader.settings.noTemporaryNavTargetOutline", __?: {}): string;
  (_: "reader.settings.paginated", __?: {}): string;
  (_: "reader.settings.paraSpacing", __?: {}): string;
  (_: "reader.settings.pdfZoom", __?: {}): {
  readonly "name": {
    readonly "100pct": string,
    readonly "150pct": string,
    readonly "200pct": string,
    readonly "300pct": string,
    readonly "500pct": string,
    readonly "50pct": string,
    readonly "fit": string,
    readonly "width": string
  },
  readonly "title": string
};
  (_: "reader.settings.pdfZoom.name", __?: {}): {
  readonly "100pct": string,
  readonly "150pct": string,
  readonly "200pct": string,
  readonly "300pct": string,
  readonly "500pct": string,
  readonly "50pct": string,
  readonly "fit": string,
  readonly "width": string
};
  (_: "reader.settings.pdfZoom.name.100pct", __?: {}): string;
  (_: "reader.settings.pdfZoom.name.150pct", __?: {}): string;
  (_: "reader.settings.pdfZoom.name.200pct", __?: {}): string;
  (_: "reader.settings.pdfZoom.name.300pct", __?: {}): string;
  (_: "reader.settings.pdfZoom.name.500pct", __?: {}): string;
  (_: "reader.settings.pdfZoom.name.50pct", __?: {}): string;
  (_: "reader.settings.pdfZoom.name.fit", __?: {}): string;
  (_: "reader.settings.pdfZoom.name.width", __?: {}): string;
  (_: "reader.settings.pdfZoom.title", __?: {}): string;
  (_: "reader.settings.preset", __?: {}): {
  readonly "apply": string,
  readonly "applyDetails": string,
  readonly "detail": string,
  readonly "reset": string,
  readonly "resetDetails": string,
  readonly "save": string,
  readonly "saveDetails": string,
  readonly "title": string
};
  (_: "reader.settings.preset.apply", __?: {}): string;
  (_: "reader.settings.preset.applyDetails", __?: {}): string;
  (_: "reader.settings.preset.detail", __?: {}): string;
  (_: "reader.settings.preset.reset", __?: {}): string;
  (_: "reader.settings.preset.resetDetails", __?: {}): string;
  (_: "reader.settings.preset.save", __?: {}): string;
  (_: "reader.settings.preset.saveDetails", __?: {}): string;
  (_: "reader.settings.preset.title", __?: {}): string;
  (_: "reader.settings.preview", __?: {}): string;
  (_: "reader.settings.reduceMotion", __?: {}): string;
  (_: "reader.settings.scrolled", __?: {}): string;
  (_: "reader.settings.spacing", __?: {}): string;
  (_: "reader.settings.text", __?: {}): string;
  (_: "reader.settings.theme", __?: {}): {
  readonly "name": {
    readonly "Contrast1": string,
    readonly "Contrast2": string,
    readonly "Contrast3": string,
    readonly "Contrast4": string,
    readonly "Neutral": string,
    readonly "Night": string,
    readonly "Paper": string,
    readonly "Sepia": string
  },
  readonly "title": string
};
  (_: "reader.settings.theme.name", __?: {}): {
  readonly "Contrast1": string,
  readonly "Contrast2": string,
  readonly "Contrast3": string,
  readonly "Contrast4": string,
  readonly "Neutral": string,
  readonly "Night": string,
  readonly "Paper": string,
  readonly "Sepia": string
};
  (_: "reader.settings.theme.name.Contrast1", __?: {}): string;
  (_: "reader.settings.theme.name.Contrast2", __?: {}): string;
  (_: "reader.settings.theme.name.Contrast3", __?: {}): string;
  (_: "reader.settings.theme.name.Contrast4", __?: {}): string;
  (_: "reader.settings.theme.name.Neutral", __?: {}): string;
  (_: "reader.settings.theme.name.Night", __?: {}): string;
  (_: "reader.settings.theme.name.Paper", __?: {}): string;
  (_: "reader.settings.theme.name.Sepia", __?: {}): string;
  (_: "reader.settings.theme.title", __?: {}): string;
  (_: "reader.settings.wordSpacing", __?: {}): string;
  (_: "reader.svg", __?: {}): { readonly "left": string, readonly "right": string };
  (_: "reader.svg.left", __?: {}): string;
  (_: "reader.svg.right", __?: {}): string;
  (_: "reader.toc", __?: {}): { readonly "publicationNoToc": string };
  (_: "reader.toc.publicationNoToc", __?: {}): string;
  (_: "reader.tts", __?: {}): {
  readonly "activate": string,
  readonly "language": string,
  readonly "next": string,
  readonly "options": string,
  readonly "pause": string,
  readonly "play": string,
  readonly "previous": string,
  readonly "sentenceDetect": string,
  readonly "sentenceDetectDescription": string,
  readonly "speed": string,
  readonly "stop": string,
  readonly "voice": string
};
  (_: "reader.tts.activate", __?: {}): string;
  (_: "reader.tts.language", __?: {}): string;
  (_: "reader.tts.next", __?: {}): string;
  (_: "reader.tts.options", __?: {}): string;
  (_: "reader.tts.pause", __?: {}): string;
  (_: "reader.tts.play", __?: {}): string;
  (_: "reader.tts.previous", __?: {}): string;
  (_: "reader.tts.sentenceDetect", __?: {}): string;
  (_: "reader.tts.sentenceDetectDescription", __?: {}): string;
  (_: "reader.tts.speed", __?: {}): string;
  (_: "reader.tts.stop", __?: {}): string;
  (_: "reader.tts.voice", __?: {}): string;
  (_: "settings", __?: {}): {
  readonly "annotationCreator": {
    readonly "creator": string,
    readonly "help": string,
    readonly "name": string,
    readonly "organization": string,
    readonly "person": string,
    readonly "type": string
  },
  readonly "auth": {
    readonly "help": string,
    readonly "title": string,
    readonly "wipeData": string
  },
  readonly "keyboard": {
    readonly "advancedMenu": string,
    readonly "cancel": string,
    readonly "disclaimer": string,
    readonly "editUserJson": string,
    readonly "keyboardShortcuts": string,
    readonly "list": {
      readonly "AddBookmarkWithLabel": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "AnnotationsCreate": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "AnnotationsCreateQuick": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "AnnotationsToggleMargin": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "AudioNext": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "AudioNextAlt": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "AudioPlayPause": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "AudioPrevious": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "AudioPreviousAlt": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "AudioStop": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "CloseReader": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FXLZoomIn": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FXLZoomOut": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FXLZoomReset": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FocusMain": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FocusMainDeep": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FocusReaderGotoPage": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FocusReaderNavigation": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FocusReaderNavigationAnnotations": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FocusReaderNavigationBookmarks": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FocusReaderNavigationSearch": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FocusReaderNavigationTOC": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FocusReaderSettings": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FocusSearch": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "FocusToolbar": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigateNextChapter": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigateNextChapterAlt": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigateNextHistory": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigateNextLibraryPage": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigateNextLibraryPageAlt": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigateNextOPDSPage": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigateNextOPDSPageAlt": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigateNextPage": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigateNextPageAlt": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigatePreviousChapter": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigatePreviousChapterAlt": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigatePreviousHistory": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigatePreviousLibraryPage": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigatePreviousLibraryPageAlt": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigatePreviousOPDSPage": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigatePreviousOPDSPageAlt": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigatePreviousPage": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigatePreviousPageAlt": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigateToBegin": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "NavigateToEnd": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "OpenReaderInfo": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "OpenReaderInfoWhereAmI": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "Print": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "SearchNext": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "SearchNextAlt": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "SearchPrevious": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "SearchPreviousAlt": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "SpeakReaderInfoWhereAmI": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "ToggleBookmark": {
        readonly "description": string,
        readonly "name": string
      },
      readonly "ToggleReaderFullscreen": {
        readonly "description": string,
        readonly "name": string
      }
    },
    readonly "loadUserJson": string,
    readonly "noShortcutFound": string,
    readonly "resetDefaults": string,
    readonly "save": string,
    readonly "searchPlaceholder": string
  },
  readonly "language": { readonly "languageChoice": string },
  readonly "library": {
    readonly "enableAPIAPP": string,
    readonly "title": string
  },
  readonly "note": {
    readonly "export": {
      readonly "applyDefaultTemplate": string,
      readonly "enableCheckbox": string,
      readonly "overrideHTMLTemplate": string
    }
  },
  readonly "profiles": {
    readonly "info": string,
    readonly "thorium": {
      readonly "description": string,
      readonly "title": string
    }
  },
  readonly "screenReaderActivate": {
    readonly "help": string,
    readonly "message": string,
    readonly "title": string
  },
  readonly "session": { readonly "title": string },
  readonly "tabs": {
    readonly "appearance": string,
    readonly "general": string,
    readonly "keyboardShortcuts": string
  },
  readonly "theme": {
    readonly "auto": string,
    readonly "dark": string,
    readonly "description": string,
    readonly "light": string,
    readonly "title": string
  }
};
  (_: "settings.annotationCreator", __?: {}): {
  readonly "creator": string,
  readonly "help": string,
  readonly "name": string,
  readonly "organization": string,
  readonly "person": string,
  readonly "type": string
};
  (_: "settings.annotationCreator.creator", __?: {}): string;
  (_: "settings.annotationCreator.help", __?: {}): string;
  (_: "settings.annotationCreator.name", __?: {}): string;
  (_: "settings.annotationCreator.organization", __?: {}): string;
  (_: "settings.annotationCreator.person", __?: {}): string;
  (_: "settings.annotationCreator.type", __?: {}): string;
  (_: "settings.auth", __?: {}): {
  readonly "help": string,
  readonly "title": string,
  readonly "wipeData": string
};
  (_: "settings.auth.help", __?: {}): string;
  (_: "settings.auth.title", __?: {}): string;
  (_: "settings.auth.wipeData", __?: {}): string;
  (_: "settings.keyboard", __?: {}): {
  readonly "advancedMenu": string,
  readonly "cancel": string,
  readonly "disclaimer": string,
  readonly "editUserJson": string,
  readonly "keyboardShortcuts": string,
  readonly "list": {
    readonly "AddBookmarkWithLabel": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "AnnotationsCreate": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "AnnotationsCreateQuick": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "AnnotationsToggleMargin": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "AudioNext": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "AudioNextAlt": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "AudioPlayPause": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "AudioPrevious": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "AudioPreviousAlt": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "AudioStop": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "CloseReader": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FXLZoomIn": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FXLZoomOut": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FXLZoomReset": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FocusMain": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FocusMainDeep": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FocusReaderGotoPage": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FocusReaderNavigation": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FocusReaderNavigationAnnotations": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FocusReaderNavigationBookmarks": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FocusReaderNavigationSearch": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FocusReaderNavigationTOC": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FocusReaderSettings": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FocusSearch": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "FocusToolbar": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigateNextChapter": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigateNextChapterAlt": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigateNextHistory": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigateNextLibraryPage": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigateNextLibraryPageAlt": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigateNextOPDSPage": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigateNextOPDSPageAlt": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigateNextPage": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigateNextPageAlt": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigatePreviousChapter": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigatePreviousChapterAlt": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigatePreviousHistory": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigatePreviousLibraryPage": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigatePreviousLibraryPageAlt": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigatePreviousOPDSPage": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigatePreviousOPDSPageAlt": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigatePreviousPage": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigatePreviousPageAlt": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigateToBegin": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "NavigateToEnd": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "OpenReaderInfo": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "OpenReaderInfoWhereAmI": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "Print": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "SearchNext": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "SearchNextAlt": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "SearchPrevious": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "SearchPreviousAlt": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "SpeakReaderInfoWhereAmI": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "ToggleBookmark": {
      readonly "description": string,
      readonly "name": string
    },
    readonly "ToggleReaderFullscreen": {
      readonly "description": string,
      readonly "name": string
    }
  },
  readonly "loadUserJson": string,
  readonly "noShortcutFound": string,
  readonly "resetDefaults": string,
  readonly "save": string,
  readonly "searchPlaceholder": string
};
  (_: "settings.keyboard.advancedMenu", __?: {}): string;
  (_: "settings.keyboard.cancel", __?: {}): string;
  (_: "settings.keyboard.disclaimer", __?: {}): string;
  (_: "settings.keyboard.editUserJson", __?: {}): string;
  (_: "settings.keyboard.keyboardShortcuts", __?: {}): string;
  (_: "settings.keyboard.list", __?: {}): {
  readonly "AddBookmarkWithLabel": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "AnnotationsCreate": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "AnnotationsCreateQuick": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "AnnotationsToggleMargin": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "AudioNext": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "AudioNextAlt": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "AudioPlayPause": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "AudioPrevious": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "AudioPreviousAlt": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "AudioStop": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "CloseReader": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FXLZoomIn": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FXLZoomOut": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FXLZoomReset": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FocusMain": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FocusMainDeep": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FocusReaderGotoPage": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FocusReaderNavigation": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FocusReaderNavigationAnnotations": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FocusReaderNavigationBookmarks": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FocusReaderNavigationSearch": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FocusReaderNavigationTOC": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FocusReaderSettings": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FocusSearch": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "FocusToolbar": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigateNextChapter": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigateNextChapterAlt": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigateNextHistory": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigateNextLibraryPage": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigateNextLibraryPageAlt": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigateNextOPDSPage": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigateNextOPDSPageAlt": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigateNextPage": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigateNextPageAlt": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigatePreviousChapter": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigatePreviousChapterAlt": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigatePreviousHistory": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigatePreviousLibraryPage": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigatePreviousLibraryPageAlt": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigatePreviousOPDSPage": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigatePreviousOPDSPageAlt": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigatePreviousPage": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigatePreviousPageAlt": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigateToBegin": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "NavigateToEnd": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "OpenReaderInfo": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "OpenReaderInfoWhereAmI": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "Print": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "SearchNext": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "SearchNextAlt": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "SearchPrevious": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "SearchPreviousAlt": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "SpeakReaderInfoWhereAmI": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "ToggleBookmark": {
    readonly "description": string,
    readonly "name": string
  },
  readonly "ToggleReaderFullscreen": {
    readonly "description": string,
    readonly "name": string
  }
};
  (_: "settings.keyboard.list.AddBookmarkWithLabel", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.AddBookmarkWithLabel.description", __?: {}): string;
  (_: "settings.keyboard.list.AddBookmarkWithLabel.name", __?: {}): string;
  (_: "settings.keyboard.list.AnnotationsCreate", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.AnnotationsCreate.description", __?: {}): string;
  (_: "settings.keyboard.list.AnnotationsCreate.name", __?: {}): string;
  (_: "settings.keyboard.list.AnnotationsCreateQuick", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.AnnotationsCreateQuick.description", __?: {}): string;
  (_: "settings.keyboard.list.AnnotationsCreateQuick.name", __?: {}): string;
  (_: "settings.keyboard.list.AnnotationsToggleMargin", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.AnnotationsToggleMargin.description", __?: {}): string;
  (_: "settings.keyboard.list.AnnotationsToggleMargin.name", __?: {}): string;
  (_: "settings.keyboard.list.AudioNext", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.AudioNext.description", __?: {}): string;
  (_: "settings.keyboard.list.AudioNext.name", __?: {}): string;
  (_: "settings.keyboard.list.AudioNextAlt", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.AudioNextAlt.description", __?: {}): string;
  (_: "settings.keyboard.list.AudioNextAlt.name", __?: {}): string;
  (_: "settings.keyboard.list.AudioPlayPause", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.AudioPlayPause.description", __?: {}): string;
  (_: "settings.keyboard.list.AudioPlayPause.name", __?: {}): string;
  (_: "settings.keyboard.list.AudioPrevious", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.AudioPrevious.description", __?: {}): string;
  (_: "settings.keyboard.list.AudioPrevious.name", __?: {}): string;
  (_: "settings.keyboard.list.AudioPreviousAlt", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.AudioPreviousAlt.description", __?: {}): string;
  (_: "settings.keyboard.list.AudioPreviousAlt.name", __?: {}): string;
  (_: "settings.keyboard.list.AudioStop", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.AudioStop.description", __?: {}): string;
  (_: "settings.keyboard.list.AudioStop.name", __?: {}): string;
  (_: "settings.keyboard.list.CloseReader", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.CloseReader.description", __?: {}): string;
  (_: "settings.keyboard.list.CloseReader.name", __?: {}): string;
  (_: "settings.keyboard.list.FXLZoomIn", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FXLZoomIn.description", __?: {}): string;
  (_: "settings.keyboard.list.FXLZoomIn.name", __?: {}): string;
  (_: "settings.keyboard.list.FXLZoomOut", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FXLZoomOut.description", __?: {}): string;
  (_: "settings.keyboard.list.FXLZoomOut.name", __?: {}): string;
  (_: "settings.keyboard.list.FXLZoomReset", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FXLZoomReset.description", __?: {}): string;
  (_: "settings.keyboard.list.FXLZoomReset.name", __?: {}): string;
  (_: "settings.keyboard.list.FocusMain", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FocusMain.description", __?: {}): string;
  (_: "settings.keyboard.list.FocusMain.name", __?: {}): string;
  (_: "settings.keyboard.list.FocusMainDeep", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FocusMainDeep.description", __?: {}): string;
  (_: "settings.keyboard.list.FocusMainDeep.name", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderGotoPage", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FocusReaderGotoPage.description", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderGotoPage.name", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderNavigation", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FocusReaderNavigation.description", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderNavigation.name", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderNavigationAnnotations", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FocusReaderNavigationAnnotations.description", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderNavigationAnnotations.name", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderNavigationBookmarks", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FocusReaderNavigationBookmarks.description", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderNavigationBookmarks.name", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderNavigationSearch", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FocusReaderNavigationSearch.description", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderNavigationSearch.name", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderNavigationTOC", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FocusReaderNavigationTOC.description", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderNavigationTOC.name", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderSettings", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FocusReaderSettings.description", __?: {}): string;
  (_: "settings.keyboard.list.FocusReaderSettings.name", __?: {}): string;
  (_: "settings.keyboard.list.FocusSearch", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FocusSearch.description", __?: {}): string;
  (_: "settings.keyboard.list.FocusSearch.name", __?: {}): string;
  (_: "settings.keyboard.list.FocusToolbar", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.FocusToolbar.description", __?: {}): string;
  (_: "settings.keyboard.list.FocusToolbar.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextChapter", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigateNextChapter.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextChapter.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextChapterAlt", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigateNextChapterAlt.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextChapterAlt.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextHistory", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigateNextHistory.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextHistory.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextLibraryPage", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigateNextLibraryPage.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextLibraryPage.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextLibraryPageAlt", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigateNextLibraryPageAlt.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextLibraryPageAlt.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextOPDSPage", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigateNextOPDSPage.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextOPDSPage.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextOPDSPageAlt", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigateNextOPDSPageAlt.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextOPDSPageAlt.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextPage", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigateNextPage.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextPage.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextPageAlt", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigateNextPageAlt.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigateNextPageAlt.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousChapter", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigatePreviousChapter.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousChapter.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousChapterAlt", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigatePreviousChapterAlt.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousChapterAlt.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousHistory", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigatePreviousHistory.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousHistory.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousLibraryPage", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigatePreviousLibraryPage.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousLibraryPage.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousLibraryPageAlt", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigatePreviousLibraryPageAlt.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousLibraryPageAlt.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousOPDSPage", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigatePreviousOPDSPage.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousOPDSPage.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousOPDSPageAlt", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigatePreviousOPDSPageAlt.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousOPDSPageAlt.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousPage", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigatePreviousPage.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousPage.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousPageAlt", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigatePreviousPageAlt.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigatePreviousPageAlt.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigateToBegin", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigateToBegin.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigateToBegin.name", __?: {}): string;
  (_: "settings.keyboard.list.NavigateToEnd", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.NavigateToEnd.description", __?: {}): string;
  (_: "settings.keyboard.list.NavigateToEnd.name", __?: {}): string;
  (_: "settings.keyboard.list.OpenReaderInfo", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.OpenReaderInfo.description", __?: {}): string;
  (_: "settings.keyboard.list.OpenReaderInfo.name", __?: {}): string;
  (_: "settings.keyboard.list.OpenReaderInfoWhereAmI", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.OpenReaderInfoWhereAmI.description", __?: {}): string;
  (_: "settings.keyboard.list.OpenReaderInfoWhereAmI.name", __?: {}): string;
  (_: "settings.keyboard.list.Print", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.Print.description", __?: {}): string;
  (_: "settings.keyboard.list.Print.name", __?: {}): string;
  (_: "settings.keyboard.list.SearchNext", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.SearchNext.description", __?: {}): string;
  (_: "settings.keyboard.list.SearchNext.name", __?: {}): string;
  (_: "settings.keyboard.list.SearchNextAlt", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.SearchNextAlt.description", __?: {}): string;
  (_: "settings.keyboard.list.SearchNextAlt.name", __?: {}): string;
  (_: "settings.keyboard.list.SearchPrevious", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.SearchPrevious.description", __?: {}): string;
  (_: "settings.keyboard.list.SearchPrevious.name", __?: {}): string;
  (_: "settings.keyboard.list.SearchPreviousAlt", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.SearchPreviousAlt.description", __?: {}): string;
  (_: "settings.keyboard.list.SearchPreviousAlt.name", __?: {}): string;
  (_: "settings.keyboard.list.SpeakReaderInfoWhereAmI", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.SpeakReaderInfoWhereAmI.description", __?: {}): string;
  (_: "settings.keyboard.list.SpeakReaderInfoWhereAmI.name", __?: {}): string;
  (_: "settings.keyboard.list.ToggleBookmark", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.ToggleBookmark.description", __?: {}): string;
  (_: "settings.keyboard.list.ToggleBookmark.name", __?: {}): string;
  (_: "settings.keyboard.list.ToggleReaderFullscreen", __?: {}): { readonly "description": string, readonly "name": string };
  (_: "settings.keyboard.list.ToggleReaderFullscreen.description", __?: {}): string;
  (_: "settings.keyboard.list.ToggleReaderFullscreen.name", __?: {}): string;
  (_: "settings.keyboard.loadUserJson", __?: {}): string;
  (_: "settings.keyboard.noShortcutFound", __?: {}): string;
  (_: "settings.keyboard.resetDefaults", __?: {}): string;
  (_: "settings.keyboard.save", __?: {}): string;
  (_: "settings.keyboard.searchPlaceholder", __?: {}): string;
  (_: "settings.language", __?: {}): { readonly "languageChoice": string };
  (_: "settings.language.languageChoice", __?: {}): string;
  (_: "settings.library", __?: {}): { readonly "enableAPIAPP": string, readonly "title": string };
  (_: "settings.library.enableAPIAPP", __?: {}): string;
  (_: "settings.library.title", __?: {}): string;
  (_: "settings.note", __?: {}): {
  readonly "export": {
    readonly "applyDefaultTemplate": string,
    readonly "enableCheckbox": string,
    readonly "overrideHTMLTemplate": string
  }
};
  (_: "settings.note.export", __?: {}): {
  readonly "applyDefaultTemplate": string,
  readonly "enableCheckbox": string,
  readonly "overrideHTMLTemplate": string
};
  (_: "settings.note.export.applyDefaultTemplate", __?: {}): string;
  (_: "settings.note.export.enableCheckbox", __?: {}): string;
  (_: "settings.note.export.overrideHTMLTemplate", __?: {}): string;
  (_: "settings.profiles", __?: {}): {
  readonly "info": string,
  readonly "thorium": {
    readonly "description": string,
    readonly "title": string
  }
};
  (_: "settings.profiles.info", __?: {}): string;
  (_: "settings.profiles.thorium", __?: {}): { readonly "description": string, readonly "title": string };
  (_: "settings.profiles.thorium.description", __?: {}): string;
  (_: "settings.profiles.thorium.title", __?: {}): string;
  (_: "settings.screenReaderActivate", __?: {}): {
  readonly "help": string,
  readonly "message": string,
  readonly "title": string
};
  (_: "settings.screenReaderActivate.help", __?: {}): string;
  (_: "settings.screenReaderActivate.message", __?: {}): string;
  (_: "settings.screenReaderActivate.title", __?: {}): string;
  (_: "settings.session", __?: {}): { readonly "title": string };
  (_: "settings.session.title", __?: {}): string;
  (_: "settings.tabs", __?: {}): {
  readonly "appearance": string,
  readonly "general": string,
  readonly "keyboardShortcuts": string
};
  (_: "settings.tabs.appearance", __?: {}): string;
  (_: "settings.tabs.general", __?: {}): string;
  (_: "settings.tabs.keyboardShortcuts", __?: {}): string;
  (_: "settings.theme", __?: {}): {
  readonly "auto": string,
  readonly "dark": string,
  readonly "description": string,
  readonly "light": string,
  readonly "title": string
};
  (_: "settings.theme.auto", __?: {}): string;
  (_: "settings.theme.dark", __?: {}): string;
  (_: "settings.theme.description", __?: {}): string;
  (_: "settings.theme.light", __?: {}): string;
  (_: "settings.theme.title", __?: {}): string;
  (_: "tts", __?: {}): {
  readonly "highlight": {
    readonly "mainColor": string,
    readonly "maskBlockWordOutline": string,
    readonly "maskBlockWordSolidBackground": string,
    readonly "maskBlockWordUnderline": string,
    readonly "maskWordOutline": string,
    readonly "maskWordSolidBackground": string,
    readonly "maskWordUnderline": string,
    readonly "outlineWordOutline": string,
    readonly "outlineWordSolidBackground": string,
    readonly "outlineWordUnderline": string,
    readonly "preview": string,
    readonly "solidBackgroundWordOutline": string,
    readonly "solidBackgroundWordSolidBackground": string,
    readonly "solidBackgroundWordUnderline": string,
    readonly "style": string,
    readonly "underlineWordOutline": string,
    readonly "underlineWordSolidBackground": string,
    readonly "underlineWordUnderline": string,
    readonly "wordColor": string
  }
};
  (_: "tts.highlight", __?: {}): {
  readonly "mainColor": string,
  readonly "maskBlockWordOutline": string,
  readonly "maskBlockWordSolidBackground": string,
  readonly "maskBlockWordUnderline": string,
  readonly "maskWordOutline": string,
  readonly "maskWordSolidBackground": string,
  readonly "maskWordUnderline": string,
  readonly "outlineWordOutline": string,
  readonly "outlineWordSolidBackground": string,
  readonly "outlineWordUnderline": string,
  readonly "preview": string,
  readonly "solidBackgroundWordOutline": string,
  readonly "solidBackgroundWordSolidBackground": string,
  readonly "solidBackgroundWordUnderline": string,
  readonly "style": string,
  readonly "underlineWordOutline": string,
  readonly "underlineWordSolidBackground": string,
  readonly "underlineWordUnderline": string,
  readonly "wordColor": string
};
  (_: "tts.highlight.mainColor", __?: {}): string;
  (_: "tts.highlight.maskBlockWordOutline", __?: {}): string;
  (_: "tts.highlight.maskBlockWordSolidBackground", __?: {}): string;
  (_: "tts.highlight.maskBlockWordUnderline", __?: {}): string;
  (_: "tts.highlight.maskWordOutline", __?: {}): string;
  (_: "tts.highlight.maskWordSolidBackground", __?: {}): string;
  (_: "tts.highlight.maskWordUnderline", __?: {}): string;
  (_: "tts.highlight.outlineWordOutline", __?: {}): string;
  (_: "tts.highlight.outlineWordSolidBackground", __?: {}): string;
  (_: "tts.highlight.outlineWordUnderline", __?: {}): string;
  (_: "tts.highlight.preview", __?: {}): string;
  (_: "tts.highlight.solidBackgroundWordOutline", __?: {}): string;
  (_: "tts.highlight.solidBackgroundWordSolidBackground", __?: {}): string;
  (_: "tts.highlight.solidBackgroundWordUnderline", __?: {}): string;
  (_: "tts.highlight.style", __?: {}): string;
  (_: "tts.highlight.underlineWordOutline", __?: {}): string;
  (_: "tts.highlight.underlineWordSolidBackground", __?: {}): string;
  (_: "tts.highlight.underlineWordUnderline", __?: {}): string;
  (_: "tts.highlight.wordColor", __?: {}): string;
  (_: "wizard", __?: {}): {
  readonly "buttons": {
    readonly "discover": string,
    readonly "goToBooks": string,
    readonly "next": string
  },
  readonly "description": {
    readonly "annotations": string,
    readonly "catalogs": string,
    readonly "home": string,
    readonly "readingView1": string,
    readonly "readingView2": string,
    readonly "yourBooks": string
  },
  readonly "dontShow": string,
  readonly "tab": {
    readonly "annotations": string,
    readonly "catalogs": string,
    readonly "home": string,
    readonly "readingView": string,
    readonly "yourBooks": string
  },
  readonly "title": {
    readonly "allBooks": string,
    readonly "newFeature": string,
    readonly "welcome": string
  }
};
  (_: "wizard.buttons", __?: {}): {
  readonly "discover": string,
  readonly "goToBooks": string,
  readonly "next": string
};
  (_: "wizard.buttons.discover", __?: {}): string;
  (_: "wizard.buttons.goToBooks", __?: {}): string;
  (_: "wizard.buttons.next", __?: {}): string;
  (_: "wizard.description", __?: {}): {
  readonly "annotations": string,
  readonly "catalogs": string,
  readonly "home": string,
  readonly "readingView1": string,
  readonly "readingView2": string,
  readonly "yourBooks": string
};
  (_: "wizard.description.annotations", __?: {}): string;
  (_: "wizard.description.catalogs", __?: {}): string;
  (_: "wizard.description.home", __?: {}): string;
  (_: "wizard.description.readingView1", __?: {}): string;
  (_: "wizard.description.readingView2", __?: {}): string;
  (_: "wizard.description.yourBooks", __?: {}): string;
  (_: "wizard.dontShow", __?: {}): string;
  (_: "wizard.tab", __?: {}): {
  readonly "annotations": string,
  readonly "catalogs": string,
  readonly "home": string,
  readonly "readingView": string,
  readonly "yourBooks": string
};
  (_: "wizard.tab.annotations", __?: {}): string;
  (_: "wizard.tab.catalogs", __?: {}): string;
  (_: "wizard.tab.home", __?: {}): string;
  (_: "wizard.tab.readingView", __?: {}): string;
  (_: "wizard.tab.yourBooks", __?: {}): string;
  (_: "wizard.title", __?: {}): {
  readonly "allBooks": string,
  readonly "newFeature": string,
  readonly "welcome": string
};
  (_: "wizard.title.allBooks", __?: {}): string;
  (_: "wizard.title.newFeature", __?: {}): string;
  (_: "wizard.title.welcome", __?: {}): string
}
}
export = typed_i18n;
