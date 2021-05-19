declare namespace typed_i18n {
  interface TFunction {
  (_: "accessibility", __?: {}): {
  readonly "bookMenu": string,
  readonly "closeDialog": string,
  readonly "homeMenu": string,
  readonly "importFile": string,
  readonly "leftSlideButton": string,
  readonly "mainContent": string,
  readonly "rightSlideButton": string,
  readonly "searchBook": string,
  readonly "skipLink": string,
  readonly "toolbar": string
};
  (_: "accessibility.bookMenu", __?: {}): string;
  (_: "accessibility.closeDialog", __?: {}): string;
  (_: "accessibility.homeMenu", __?: {}): string;
  (_: "accessibility.importFile", __?: {}): string;
  (_: "accessibility.leftSlideButton", __?: {}): string;
  (_: "accessibility.mainContent", __?: {}): string;
  (_: "accessibility.rightSlideButton", __?: {}): string;
  (_: "accessibility.searchBook", __?: {}): string;
  (_: "accessibility.skipLink", __?: {}): string;
  (_: "accessibility.toolbar", __?: {}): string;
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
  readonly "hide": string,
  readonly "quit": string,
  readonly "session": {
    readonly "exit": {
    readonly "askBox": {
        readonly "button": { readonly "no": string, readonly "yes": string },
        readonly "message": string,
        readonly "title": string
    }
    }
  },
  readonly "window": { readonly "showLibrary": string }
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
  (_: "app.edit.undo", __?: {}): string; (_: "app.hide", __?: {}): string;
  (_: "app.quit", __?: {}): string;
  (_: "app.session", __?: {}): {
  readonly "exit": {
    readonly "askBox": {
    readonly "button": { readonly "no": string, readonly "yes": string },
    readonly "message": string,
    readonly "title": string
    }
  }
};
  (_: "app.session.exit", __?: {}): {
  readonly "askBox": {
    readonly "button": { readonly "no": string, readonly "yes": string },
    readonly "message": string,
    readonly "title": string
  }
};
  (_: "app.session.exit.askBox", __?: {}): {
  readonly "button": { readonly "no": string, readonly "yes": string },
  readonly "message": string,
  readonly "title": string
};
  (_: "app.session.exit.askBox.button", __?: {}): { readonly "no": string, readonly "yes": string };
  (_: "app.session.exit.askBox.button.no", __?: {}): string;
  (_: "app.session.exit.askBox.button.yes", __?: {}): string;
  (_: "app.session.exit.askBox.message", __?: {}): string;
  (_: "app.session.exit.askBox.title", __?: {}): string;
  (_: "app.window", __?: {}): { readonly "showLibrary": string };
  (_: "app.window.showLibrary", __?: {}): string;
  (_: "catalog", __?: {}): {
  readonly "about": { readonly "button": string, readonly "title": string },
  readonly "addBookToLib": string,
  readonly "addTags": string,
  readonly "addTagsButton": string,
  readonly "allBooks": string,
  readonly "bookInfo": string,
  readonly "delete": string,
  readonly "deleteBook": string,
  readonly "deleteTag": string,
  readonly "description": string,
  readonly "emptyTagList": string,
  readonly "entry": {
    readonly "continueReading": string,
    readonly "continueReadingAudioBooks": string,
    readonly "continueReadingDivina": string,
    readonly "continueReadingPdf": string,
    readonly "lastAdditions": string
  },
  readonly "export": string,
  readonly "lang": string,
  readonly "moreInfo": string,
  readonly "myBooks": string,
  readonly "noPublicationHelpL1": string,
  readonly "noPublicationHelpL2": string,
  readonly "noPublicationHelpL3": string,
  readonly "noPublicationHelpL4": string,
  readonly "numberOfPages": string,
  readonly "opds": {
    readonly "auth": { readonly "cancel": string, readonly "login": string },
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
  readonly "tagCount": string,
  readonly "tags": string
};
  (_: "catalog.about", __?: {}): { readonly "button": string, readonly "title": string };
  (_: "catalog.about.button", __?: {}): string;
  (_: "catalog.about.title", __?: {}): string;
  (_: "catalog.addBookToLib", __?: {}): string;
  (_: "catalog.addTags", __?: {}): string;
  (_: "catalog.addTagsButton", __?: {}): string;
  (_: "catalog.allBooks", __?: {}): string;
  (_: "catalog.bookInfo", __?: {}): string;
  (_: "catalog.delete", __?: {}): string;
  (_: "catalog.deleteBook", __?: {}): string;
  (_: "catalog.deleteTag", __?: {}): string;
  (_: "catalog.description", __?: {}): string;
  (_: "catalog.emptyTagList", __?: {}): string;
  (_: "catalog.entry", __?: {}): {
  readonly "continueReading": string,
  readonly "continueReadingAudioBooks": string,
  readonly "continueReadingDivina": string,
  readonly "continueReadingPdf": string,
  readonly "lastAdditions": string
};
  (_: "catalog.entry.continueReading", __?: {}): string;
  (_: "catalog.entry.continueReadingAudioBooks", __?: {}): string;
  (_: "catalog.entry.continueReadingDivina", __?: {}): string;
  (_: "catalog.entry.continueReadingPdf", __?: {}): string;
  (_: "catalog.entry.lastAdditions", __?: {}): string;
  (_: "catalog.export", __?: {}): string;
  (_: "catalog.lang", __?: {}): string;
  (_: "catalog.moreInfo", __?: {}): string;
  (_: "catalog.myBooks", __?: {}): string;
  (_: "catalog.noPublicationHelpL1", __?: {}): string;
  (_: "catalog.noPublicationHelpL2", __?: {}): string;
  (_: "catalog.noPublicationHelpL3", __?: {}): string;
  (_: "catalog.noPublicationHelpL4", __?: {}): string;
  (_: "catalog.numberOfPages", __?: {}): string;
  (_: "catalog.opds", __?: {}): {
  readonly "auth": { readonly "cancel": string, readonly "login": string },
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
  (_: "catalog.opds.auth", __?: {}): { readonly "cancel": string, readonly "login": string };
  (_: "catalog.opds.auth.cancel", __?: {}): string;
  (_: "catalog.opds.auth.login", __?: {}): string;
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
  (_: "catalog.sort", __?: {}): string;
  (_: "catalog.tagCount", __?: {}): string;
  (_: "catalog.tags", __?: {}): string;
  (_: "dialog", __?: {}): {
  readonly "closeModalWindow": string,
  readonly "deleteFeed": string,
  readonly "deletePublication": string,
  readonly "import": string,
  readonly "importError": string,
  readonly "no": string,
  readonly "renew": string,
  readonly "return": string,
  readonly "yes": string
};
  (_: "dialog.closeModalWindow", __?: {}): string;
  (_: "dialog.deleteFeed", __?: {}): string;
  (_: "dialog.deletePublication", __?: {}): string;
  (_: "dialog.import", __?: {}): string;
  (_: "dialog.importError", __?: {}): string;
  (_: "dialog.no", __?: {}): string; (_: "dialog.renew", __?: {}): string;
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
  readonly "books": string,
  readonly "catalogs": string,
  readonly "downloads": string,
  readonly "gridTitle": string,
  readonly "home": string,
  readonly "homeTitle": string,
  readonly "importTitle": string,
  readonly "listTitle": string,
  readonly "refreshTitle": string,
  readonly "searchPlaceholder": string,
  readonly "searchTitle": string,
  readonly "settings": string
};
  (_: "header.allBooks", __?: {}): string;
  (_: "header.books", __?: {}): string;
  (_: "header.catalogs", __?: {}): string;
  (_: "header.downloads", __?: {}): string;
  (_: "header.gridTitle", __?: {}): string;
  (_: "header.home", __?: {}): string;
  (_: "header.homeTitle", __?: {}): string;
  (_: "header.importTitle", __?: {}): string;
  (_: "header.listTitle", __?: {}): string;
  (_: "header.refreshTitle", __?: {}): string;
  (_: "header.searchPlaceholder", __?: {}): string;
  (_: "header.searchTitle", __?: {}): string;
  (_: "header.settings", __?: {}): string;
  (_: "library", __?: {}): {
  readonly "lcp": {
    readonly "cancel": string,
    readonly "hint": string,
    readonly "password": string,
    readonly "sentence": string,
    readonly "submit": string,
    readonly "urlHint": string
  }
};
  (_: "library.lcp", __?: {}): {
  readonly "cancel": string,
  readonly "hint": string,
  readonly "password": string,
  readonly "sentence": string,
  readonly "submit": string,
  readonly "urlHint": string
};
  (_: "library.lcp.cancel", __?: {}): string;
  (_: "library.lcp.hint", __?: {}): string;
  (_: "library.lcp.password", __?: {}): string;
  (_: "library.lcp.sentence", __?: {}): string;
  (_: "library.lcp.submit", __?: {}): string;
  (_: "library.lcp.urlHint", __?: {}): string;
  (_: "message", __?: {}): {
  readonly "download": { readonly "error": string },
  readonly "import": {
    readonly "alreadyImport": string,
    readonly "fail": string,
    readonly "success": string
  },
  readonly "open": { readonly "error": string }
};
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
  readonly "addForm": {
    readonly "addButton": string,
    readonly "name": string,
    readonly "namePlaceholder": string,
    readonly "title": string,
    readonly "url": string,
    readonly "urlPlaceholder": string
  },
  readonly "addMenu": string,
  readonly "back": string,
  readonly "breadcrumbRoot": string,
  readonly "empty": string,
  readonly "firstPage": string,
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
  readonly "shelf": string
};
  (_: "opds.addForm", __?: {}): {
  readonly "addButton": string,
  readonly "name": string,
  readonly "namePlaceholder": string,
  readonly "title": string,
  readonly "url": string,
  readonly "urlPlaceholder": string
};
  (_: "opds.addForm.addButton", __?: {}): string;
  (_: "opds.addForm.name", __?: {}): string;
  (_: "opds.addForm.namePlaceholder", __?: {}): string;
  (_: "opds.addForm.title", __?: {}): string;
  (_: "opds.addForm.url", __?: {}): string;
  (_: "opds.addForm.urlPlaceholder", __?: {}): string;
  (_: "opds.addMenu", __?: {}): string; (_: "opds.back", __?: {}): string;
  (_: "opds.breadcrumbRoot", __?: {}): string;
  (_: "opds.empty", __?: {}): string; (_: "opds.firstPage", __?: {}): string;
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
  (_: "publication", __?: {}): {
  readonly "audio": { readonly "tracks": string },
  readonly "cancelledLcp": string,
  readonly "certificateRevoked": string,
  readonly "certificateSignatureInvalid": string,
  readonly "cover": { readonly "img": string },
  readonly "duration": { readonly "title": string },
  readonly "expiredLcp": string,
  readonly "lcpEnd": string,
  readonly "lcpRightsCopy": string,
  readonly "lcpRightsPrint": string,
  readonly "lcpStart": string,
  readonly "licenseOutOfDate": string,
  readonly "licenseSignatureDateInvalid": string,
  readonly "licenseSignatureInvalid": string,
  readonly "progression": { readonly "title": string },
  readonly "renewButton": string,
  readonly "returnButton": string,
  readonly "returnedLcp": string,
  readonly "revokedLcp": string,
  readonly "seeLess": string,
  readonly "seeMore": string,
  readonly "userKeyCheckInvalid": string
};
  (_: "publication.audio", __?: {}): { readonly "tracks": string };
  (_: "publication.audio.tracks", __?: {}): string;
  (_: "publication.cancelledLcp", __?: {}): string;
  (_: "publication.certificateRevoked", __?: {}): string;
  (_: "publication.certificateSignatureInvalid", __?: {}): string;
  (_: "publication.cover", __?: {}): { readonly "img": string };
  (_: "publication.cover.img", __?: {}): string;
  (_: "publication.duration", __?: {}): { readonly "title": string };
  (_: "publication.duration.title", __?: {}): string;
  (_: "publication.expiredLcp", __?: {}): string;
  (_: "publication.lcpEnd", __?: {}): string;
  (_: "publication.lcpRightsCopy", __?: {}): string;
  (_: "publication.lcpRightsPrint", __?: {}): string;
  (_: "publication.lcpStart", __?: {}): string;
  (_: "publication.licenseOutOfDate", __?: {}): string;
  (_: "publication.licenseSignatureDateInvalid", __?: {}): string;
  (_: "publication.licenseSignatureInvalid", __?: {}): string;
  (_: "publication.progression", __?: {}): { readonly "title": string };
  (_: "publication.progression.title", __?: {}): string;
  (_: "publication.renewButton", __?: {}): string;
  (_: "publication.returnButton", __?: {}): string;
  (_: "publication.returnedLcp", __?: {}): string;
  (_: "publication.revokedLcp", __?: {}): string;
  (_: "publication.seeLess", __?: {}): string;
  (_: "publication.seeMore", __?: {}): string;
  (_: "publication.userKeyCheckInvalid", __?: {}): string;
  (_: "reader", __?: {}): {
  readonly "footerInfo": {
    readonly "lessInfo": string,
    readonly "moreInfo": string
  },
  readonly "marks": {
    readonly "annotations": string,
    readonly "bookmarks": string,
    readonly "delete": string,
    readonly "edit": string,
    readonly "landmarks": string,
    readonly "search": string,
    readonly "toc": string
  },
  readonly "media-overlays": {
    readonly "activate": string,
    readonly "captions": string,
    readonly "next": string,
    readonly "pause": string,
    readonly "play": string,
    readonly "previous": string,
    readonly "skip": string,
    readonly "speed": string,
    readonly "stop": string,
    readonly "title": string
  },
  readonly "navigation": {
    readonly "backHomeTitle": string,
    readonly "bookmarkTitle": string,
    readonly "currentPage": string,
    readonly "currentPageTotal": string,
    readonly "detachWindowTitle": string,
    readonly "fullscreenTitle": string,
    readonly "goTo": string,
    readonly "goToError": string,
    readonly "goToPlaceHolder": string,
    readonly "goToTitle": string,
    readonly "infoTitle": string,
    readonly "magnifyingGlassButton": string,
    readonly "openTableOfContentsTitle": string,
    readonly "pdfscalemode": string,
    readonly "quitFullscreenTitle": string,
    readonly "readBookTitle": string,
    readonly "settingsTitle": string
  },
  readonly "picker": {
    readonly "annotationTitle": string,
    readonly "search": {
    readonly "founds": string,
    readonly "input": string,
    readonly "next": string,
    readonly "notFound": string,
    readonly "previous": string,
    readonly "submit": string
    },
    readonly "searchTitle": string
  },
  readonly "settings": {
    readonly "column": {
    readonly "auto": string,
    readonly "one": string,
    readonly "oneTitle": string,
    readonly "title": string,
    readonly "two": string,
    readonly "twoTitle": string
    },
    readonly "display": string,
    readonly "disposition": { readonly "title": string },
    readonly "font": string,
    readonly "fontSize": string,
    readonly "justification": string,
    readonly "justify": string,
    readonly "letterSpacing": string,
    readonly "lineSpacing": string,
    readonly "margin": string,
    readonly "noFootnotes": string,
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
    readonly "reduceMotion": string,
    readonly "save": {
    readonly "apply": string,
    readonly "reset": string,
    readonly "title": string
    },
    readonly "scrolled": string,
    readonly "spacing": string,
    readonly "text": string,
    readonly "theme": {
    readonly "name": {
        readonly "Neutral": string,
        readonly "Night": string,
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
    readonly "next": string,
    readonly "pause": string,
    readonly "play": string,
    readonly "previous": string,
    readonly "speed": string,
    readonly "stop": string
  }
};
  (_: "reader.footerInfo", __?: {}): { readonly "lessInfo": string, readonly "moreInfo": string };
  (_: "reader.footerInfo.lessInfo", __?: {}): string;
  (_: "reader.footerInfo.moreInfo", __?: {}): string;
  (_: "reader.marks", __?: {}): {
  readonly "annotations": string,
  readonly "bookmarks": string,
  readonly "delete": string,
  readonly "edit": string,
  readonly "landmarks": string,
  readonly "search": string,
  readonly "toc": string
};
  (_: "reader.marks.annotations", __?: {}): string;
  (_: "reader.marks.bookmarks", __?: {}): string;
  (_: "reader.marks.delete", __?: {}): string;
  (_: "reader.marks.edit", __?: {}): string;
  (_: "reader.marks.landmarks", __?: {}): string;
  (_: "reader.marks.search", __?: {}): string;
  (_: "reader.marks.toc", __?: {}): string;
  (_: "reader.media-overlays", __?: {}): {
  readonly "activate": string,
  readonly "captions": string,
  readonly "next": string,
  readonly "pause": string,
  readonly "play": string,
  readonly "previous": string,
  readonly "skip": string,
  readonly "speed": string,
  readonly "stop": string,
  readonly "title": string
};
  (_: "reader.media-overlays.activate", __?: {}): string;
  (_: "reader.media-overlays.captions", __?: {}): string;
  (_: "reader.media-overlays.next", __?: {}): string;
  (_: "reader.media-overlays.pause", __?: {}): string;
  (_: "reader.media-overlays.play", __?: {}): string;
  (_: "reader.media-overlays.previous", __?: {}): string;
  (_: "reader.media-overlays.skip", __?: {}): string;
  (_: "reader.media-overlays.speed", __?: {}): string;
  (_: "reader.media-overlays.stop", __?: {}): string;
  (_: "reader.media-overlays.title", __?: {}): string;
  (_: "reader.navigation", __?: {}): {
  readonly "backHomeTitle": string,
  readonly "bookmarkTitle": string,
  readonly "currentPage": string,
  readonly "currentPageTotal": string,
  readonly "detachWindowTitle": string,
  readonly "fullscreenTitle": string,
  readonly "goTo": string,
  readonly "goToError": string,
  readonly "goToPlaceHolder": string,
  readonly "goToTitle": string,
  readonly "infoTitle": string,
  readonly "magnifyingGlassButton": string,
  readonly "openTableOfContentsTitle": string,
  readonly "pdfscalemode": string,
  readonly "quitFullscreenTitle": string,
  readonly "readBookTitle": string,
  readonly "settingsTitle": string
};
  (_: "reader.navigation.backHomeTitle", __?: {}): string;
  (_: "reader.navigation.bookmarkTitle", __?: {}): string;
  (_: "reader.navigation.currentPage", __?: {}): string;
  (_: "reader.navigation.currentPageTotal", __?: {}): string;
  (_: "reader.navigation.detachWindowTitle", __?: {}): string;
  (_: "reader.navigation.fullscreenTitle", __?: {}): string;
  (_: "reader.navigation.goTo", __?: {}): string;
  (_: "reader.navigation.goToError", __?: {}): string;
  (_: "reader.navigation.goToPlaceHolder", __?: {}): string;
  (_: "reader.navigation.goToTitle", __?: {}): string;
  (_: "reader.navigation.infoTitle", __?: {}): string;
  (_: "reader.navigation.magnifyingGlassButton", __?: {}): string;
  (_: "reader.navigation.openTableOfContentsTitle", __?: {}): string;
  (_: "reader.navigation.pdfscalemode", __?: {}): string;
  (_: "reader.navigation.quitFullscreenTitle", __?: {}): string;
  (_: "reader.navigation.readBookTitle", __?: {}): string;
  (_: "reader.navigation.settingsTitle", __?: {}): string;
  (_: "reader.picker", __?: {}): {
  readonly "annotationTitle": string,
  readonly "search": {
    readonly "founds": string,
    readonly "input": string,
    readonly "next": string,
    readonly "notFound": string,
    readonly "previous": string,
    readonly "submit": string
  },
  readonly "searchTitle": string
};
  (_: "reader.picker.annotationTitle", __?: {}): string;
  (_: "reader.picker.search", __?: {}): {
  readonly "founds": string,
  readonly "input": string,
  readonly "next": string,
  readonly "notFound": string,
  readonly "previous": string,
  readonly "submit": string
};
  (_: "reader.picker.search.founds", __?: {}): string;
  (_: "reader.picker.search.input", __?: {}): string;
  (_: "reader.picker.search.next", __?: {}): string;
  (_: "reader.picker.search.notFound", __?: {}): string;
  (_: "reader.picker.search.previous", __?: {}): string;
  (_: "reader.picker.search.submit", __?: {}): string;
  (_: "reader.picker.searchTitle", __?: {}): string;
  (_: "reader.settings", __?: {}): {
  readonly "column": {
    readonly "auto": string,
    readonly "one": string,
    readonly "oneTitle": string,
    readonly "title": string,
    readonly "two": string,
    readonly "twoTitle": string
  },
  readonly "display": string,
  readonly "disposition": { readonly "title": string },
  readonly "font": string,
  readonly "fontSize": string,
  readonly "justification": string,
  readonly "justify": string,
  readonly "letterSpacing": string,
  readonly "lineSpacing": string,
  readonly "margin": string,
  readonly "noFootnotes": string,
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
  readonly "reduceMotion": string,
  readonly "save": {
    readonly "apply": string,
    readonly "reset": string,
    readonly "title": string
  },
  readonly "scrolled": string,
  readonly "spacing": string,
  readonly "text": string,
  readonly "theme": {
    readonly "name": {
    readonly "Neutral": string,
    readonly "Night": string,
    readonly "Sepia": string
    },
    readonly "title": string
  },
  readonly "wordSpacing": string
};
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
  (_: "reader.settings.disposition", __?: {}): { readonly "title": string };
  (_: "reader.settings.disposition.title", __?: {}): string;
  (_: "reader.settings.font", __?: {}): string;
  (_: "reader.settings.fontSize", __?: {}): string;
  (_: "reader.settings.justification", __?: {}): string;
  (_: "reader.settings.justify", __?: {}): string;
  (_: "reader.settings.letterSpacing", __?: {}): string;
  (_: "reader.settings.lineSpacing", __?: {}): string;
  (_: "reader.settings.margin", __?: {}): string;
  (_: "reader.settings.noFootnotes", __?: {}): string;
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
  (_: "reader.settings.reduceMotion", __?: {}): string;
  (_: "reader.settings.save", __?: {}): {
  readonly "apply": string,
  readonly "reset": string,
  readonly "title": string
};
  (_: "reader.settings.save.apply", __?: {}): string;
  (_: "reader.settings.save.reset", __?: {}): string;
  (_: "reader.settings.save.title", __?: {}): string;
  (_: "reader.settings.scrolled", __?: {}): string;
  (_: "reader.settings.spacing", __?: {}): string;
  (_: "reader.settings.text", __?: {}): string;
  (_: "reader.settings.theme", __?: {}): {
  readonly "name": {
    readonly "Neutral": string,
    readonly "Night": string,
    readonly "Sepia": string
  },
  readonly "title": string
};
  (_: "reader.settings.theme.name", __?: {}): {
  readonly "Neutral": string,
  readonly "Night": string,
  readonly "Sepia": string
};
  (_: "reader.settings.theme.name.Neutral", __?: {}): string;
  (_: "reader.settings.theme.name.Night", __?: {}): string;
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
  readonly "next": string,
  readonly "pause": string,
  readonly "play": string,
  readonly "previous": string,
  readonly "speed": string,
  readonly "stop": string
};
  (_: "reader.tts.activate", __?: {}): string;
  (_: "reader.tts.next", __?: {}): string;
  (_: "reader.tts.pause", __?: {}): string;
  (_: "reader.tts.play", __?: {}): string;
  (_: "reader.tts.previous", __?: {}): string;
  (_: "reader.tts.speed", __?: {}): string;
  (_: "reader.tts.stop", __?: {}): string;
  (_: "settings", __?: {}): {
  readonly "auth": { readonly "wipeData": string },
  readonly "keyboard": {
    readonly "advancedMenu": string,
    readonly "cancel": string,
    readonly "edit": string,
    readonly "editUserJson": string,
    readonly "hide": string,
    readonly "keyboardShortcuts": string,
    readonly "loadUserJson": string,
    readonly "resetDefaults": string,
    readonly "save": string,
    readonly "show": string
  },
  readonly "language": { readonly "languageChoice": string },
  readonly "session": {
    readonly "no": string,
    readonly "title": string,
    readonly "yes": string
  }
};
  (_: "settings.auth", __?: {}): { readonly "wipeData": string };
  (_: "settings.auth.wipeData", __?: {}): string;
  (_: "settings.keyboard", __?: {}): {
  readonly "advancedMenu": string,
  readonly "cancel": string,
  readonly "edit": string,
  readonly "editUserJson": string,
  readonly "hide": string,
  readonly "keyboardShortcuts": string,
  readonly "loadUserJson": string,
  readonly "resetDefaults": string,
  readonly "save": string,
  readonly "show": string
};
  (_: "settings.keyboard.advancedMenu", __?: {}): string;
  (_: "settings.keyboard.cancel", __?: {}): string;
  (_: "settings.keyboard.edit", __?: {}): string;
  (_: "settings.keyboard.editUserJson", __?: {}): string;
  (_: "settings.keyboard.hide", __?: {}): string;
  (_: "settings.keyboard.keyboardShortcuts", __?: {}): string;
  (_: "settings.keyboard.loadUserJson", __?: {}): string;
  (_: "settings.keyboard.resetDefaults", __?: {}): string;
  (_: "settings.keyboard.save", __?: {}): string;
  (_: "settings.keyboard.show", __?: {}): string;
  (_: "settings.language", __?: {}): { readonly "languageChoice": string };
  (_: "settings.language.languageChoice", __?: {}): string;
  (_: "settings.session", __?: {}): { readonly "no": string, readonly "title": string, readonly "yes": string };
  (_: "settings.session.no", __?: {}): string;
  (_: "settings.session.title", __?: {}): string;
  (_: "settings.session.yes", __?: {}): string
}
}
export = typed_i18n;
