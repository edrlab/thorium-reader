declare namespace typed_i18n_keys {
    type TTranslatorKeyParameter = "accessibility" | "accessibility.bookMenu" | "accessibility.closeDialog" | "accessibility.importFile" | "accessibility.leftSlideButton" | "accessibility.mainContent" | "accessibility.rightSlideButton" | "accessibility.skipLink" | "accessibility.toolbar" | "apiapp" | "apiapp.documentation" | "apiapp.howItWorks" | "apiapp.informations" | "apiapp.noLibraryFound" | "app" | "app.edit" | "app.edit.copy" | "app.edit.cut" | "app.edit.paste" | "app.edit.redo" | "app.edit.selectAll" | "app.edit.title" | "app.edit.undo" | "app.hide" | "app.quit" | "app.session" | "app.session.exit" | "app.session.exit.askBox" | "app.session.exit.askBox.button" | "app.session.exit.askBox.button.no" | "app.session.exit.askBox.button.yes" | "app.session.exit.askBox.help" | "app.session.exit.askBox.message" | "app.session.exit.askBox.title" | "app.update" | "app.update.message" | "app.update.title" | "app.window" | "app.window.showLibrary" | "catalog" | "catalog.about" | "catalog.about.title" | "catalog.addBookToLib" | "catalog.addTags" | "catalog.addTagsButton" | "catalog.allBooks" | "catalog.bookInfo" | "catalog.column" | "catalog.column.ascending" | "catalog.column.descending" | "catalog.column.unsorted" | "catalog.delete" | "catalog.deleteBook" | "catalog.deleteTag" | "catalog.description" | "catalog.emptyTagList" | "catalog.entry" | "catalog.entry.continueReading" | "catalog.entry.lastAdditions" | "catalog.export" | "catalog.exportAnnotation" | "catalog.format" | "catalog.importAnnotation" | "catalog.lang" | "catalog.lastRead" | "catalog.moreInfo" | "catalog.myBooks" | "catalog.noPublicationHelpL1" | "catalog.noPublicationHelpL2" | "catalog.noPublicationHelpL3" | "catalog.noPublicationHelpL4" | "catalog.numberOfPages" | "catalog.opds" | "catalog.opds.auth" | "catalog.opds.auth.cancel" | "catalog.opds.auth.login" | "catalog.opds.auth.password" | "catalog.opds.auth.register" | "catalog.opds.auth.username" | "catalog.opds.info" | "catalog.opds.info.availableSince" | "catalog.opds.info.availableState" | "catalog.opds.info.availableState.available" | "catalog.opds.info.availableState.ready" | "catalog.opds.info.availableState.reserved" | "catalog.opds.info.availableState.unavailable" | "catalog.opds.info.availableState.unknown" | "catalog.opds.info.availableUntil" | "catalog.opds.info.copyAvalaible" | "catalog.opds.info.copyTotal" | "catalog.opds.info.holdPosition" | "catalog.opds.info.holdTotal" | "catalog.opds.info.numberOfItems" | "catalog.opds.info.priveValue" | "catalog.opds.info.state" | "catalog.publisher" | "catalog.readBook" | "catalog.released" | "catalog.sort" | "catalog.tag" | "catalog.tags" | "catalog.update" | "dialog" | "dialog.annotations" | "dialog.annotations.descAuthor" | "dialog.annotations.descCreator" | "dialog.annotations.descList" | "dialog.annotations.descNewer" | "dialog.annotations.descOlder" | "dialog.annotations.descTitle" | "dialog.annotations.importAll" | "dialog.annotations.importWithoutConflict" | "dialog.annotations.origin" | "dialog.annotations.title" | "dialog.cancel" | "dialog.deleteAnnotations" | "dialog.deleteAnnotationsText" | "dialog.deleteFeed" | "dialog.deletePublication" | "dialog.import" | "dialog.importError" | "dialog.renew" | "dialog.return" | "dialog.yes" | "error" | "error.errorBox" | "error.errorBox.error" | "error.errorBox.message" | "error.errorBox.title" | "header" | "header.allBooks" | "header.catalogs" | "header.downloads" | "header.fitlerTagTitle" | "header.gridTitle" | "header.home" | "header.homeTitle" | "header.importTitle" | "header.listTitle" | "header.myCatalogs" | "header.refreshTitle" | "header.searchPlaceholder" | "header.searchTitle" | "header.settings" | "header.viewMode" | "library" | "library.lcp" | "library.lcp.hint" | "library.lcp.open" | "library.lcp.password" | "library.lcp.sentence" | "library.lcp.urlHint" | "library.lcp.whatIsLcp?" | "library.lcp.whatIsLcpInfoDetails" | "library.lcp.whatIsLcpInfoDetailsLink" | "message" | "message.annotations" | "message.annotations.alreadyImported" | "message.annotations.emptyFile" | "message.annotations.errorParsing" | "message.annotations.noBelongTo" | "message.annotations.nothing" | "message.annotations.success" | "message.download" | "message.download.error" | "message.import" | "message.import.alreadyImport" | "message.import.fail" | "message.import.seeInLibrary" | "message.import.success" | "message.open" | "message.open.error" | "opds" | "opds.addForm" | "opds.addForm.addButton" | "opds.addForm.name" | "opds.addForm.namePlaceholder" | "opds.addForm.url" | "opds.addForm.urlPlaceholder" | "opds.addFormApiapp" | "opds.addFormApiapp.title" | "opds.addMenu" | "opds.breadcrumbRoot" | "opds.documentation" | "opds.empty" | "opds.firstPage" | "opds.informations" | "opds.lastPage" | "opds.menu" | "opds.menu.aboutBook" | "opds.menu.addExtract" | "opds.menu.goBuyBook" | "opds.menu.goLoanBook" | "opds.menu.goRevokeLoanBook" | "opds.menu.goSubBook" | "opds.network" | "opds.network.error" | "opds.network.noInternet" | "opds.network.noInternetMessage" | "opds.network.reject" | "opds.network.timeout" | "opds.next" | "opds.previous" | "opds.shelf" | "opds.updateForm" | "opds.updateForm.name" | "opds.updateForm.title" | "opds.updateForm.updateButton" | "opds.updateForm.url" | "opds.whatIsOpds" | "publication" | "publication.accessibility" | "publication.accessibility.accessModeSufficient" | "publication.accessibility.accessModeSufficient.textual" | "publication.accessibility.accessibilityFeature" | "publication.accessibility.accessibilityFeature.alternativeText" | "publication.accessibility.accessibilityFeature.displayTransformability" | "publication.accessibility.accessibilityFeature.longDescription" | "publication.accessibility.accessibilityFeature.printPageNumbers" | "publication.accessibility.accessibilityFeature.readingOrder" | "publication.accessibility.accessibilityFeature.synchronizedAudioText" | "publication.accessibility.accessibilityFeature.tableOfContents" | "publication.accessibility.accessibilityHazard" | "publication.accessibility.accessibilityHazard.flashing" | "publication.accessibility.accessibilityHazard.motionSimulation" | "publication.accessibility.accessibilityHazard.name" | "publication.accessibility.accessibilityHazard.noFlashing" | "publication.accessibility.accessibilityHazard.noMotionSimulation" | "publication.accessibility.accessibilityHazard.noSound" | "publication.accessibility.accessibilityHazard.none" | "publication.accessibility.accessibilityHazard.sound" | "publication.accessibility.accessibilityHazard.unknown" | "publication.accessibility.certifierReport" | "publication.accessibility.conformsTo" | "publication.accessibility.moreInformation" | "publication.accessibility.name" | "publication.accessibility.noA11y" | "publication.actions" | "publication.audio" | "publication.audio.tracks" | "publication.author" | "publication.cancelledLcp" | "publication.certificateRevoked" | "publication.certificateSignatureInvalid" | "publication.cover" | "publication.cover.img" | "publication.day" | "publication.days" | "publication.duration" | "publication.duration.title" | "publication.encryptedNoLicense" | "publication.expired" | "publication.expiredLcp" | "publication.incorrectPassphrase" | "publication.lcpEnd" | "publication.lcpRightsCopy" | "publication.lcpRightsPrint" | "publication.lcpStart" | "publication.licenceLCP" | "publication.licenseCertificateDateInvalid" | "publication.licenseOutOfDate" | "publication.licenseSignatureInvalid" | "publication.licensed" | "publication.markAsRead" | "publication.notStarted" | "publication.onGoing" | "publication.progression" | "publication.progression.title" | "publication.read" | "publication.remainingTime" | "publication.renewButton" | "publication.returnButton" | "publication.returnedLcp" | "publication.revokedLcp" | "publication.seeLess" | "publication.seeMore" | "publication.timeLeft" | "publication.title" | "publication.userKeyCheckInvalid" | "reader" | "reader.annotations" | "reader.annotations.Color" | "reader.annotations.addNote" | "reader.annotations.advancedMode" | "reader.annotations.annotationsExport" | "reader.annotations.annotationsExport.description" | "reader.annotations.annotationsExport.title" | "reader.annotations.annotationsOptions" | "reader.annotations.colors" | "reader.annotations.colors.cyan" | "reader.annotations.colors.green" | "reader.annotations.colors.orange" | "reader.annotations.colors.purple" | "reader.annotations.colors.red" | "reader.annotations.colors.yellow" | "reader.annotations.date" | "reader.annotations.export" | "reader.annotations.filter" | "reader.annotations.filter.all" | "reader.annotations.filter.filterByColor" | "reader.annotations.filter.filterByCreator" | "reader.annotations.filter.filterByDrawtype" | "reader.annotations.filter.filterByTag" | "reader.annotations.filter.filterOptions" | "reader.annotations.filter.none" | "reader.annotations.hide" | "reader.annotations.highlight" | "reader.annotations.noSelectionToast" | "reader.annotations.note" | "reader.annotations.quickAnnotations" | "reader.annotations.saveNote" | "reader.annotations.sorting" | "reader.annotations.sorting.lastcreated" | "reader.annotations.sorting.lastmodified" | "reader.annotations.sorting.progression" | "reader.annotations.sorting.sortingOptions" | "reader.annotations.toggleMarginMarks" | "reader.annotations.type" | "reader.annotations.type.outline" | "reader.annotations.type.solid" | "reader.annotations.type.strikethrough" | "reader.annotations.type.underline" | "reader.divina" | "reader.divina.mute" | "reader.divina.unmute" | "reader.fxl" | "reader.fxl.fit" | "reader.goToContent" | "reader.marks" | "reader.marks.annotations" | "reader.marks.bookmarks" | "reader.marks.delete" | "reader.marks.edit" | "reader.marks.goTo" | "reader.marks.landmarks" | "reader.marks.progression" | "reader.marks.saveMark" | "reader.marks.search" | "reader.marks.searchResult" | "reader.marks.toc" | "reader.media-overlays" | "reader.media-overlays.activate" | "reader.media-overlays.captions" | "reader.media-overlays.captionsDescription" | "reader.media-overlays.disableContinuousPlay" | "reader.media-overlays.disableContinuousPlayDescription" | "reader.media-overlays.ignoreAndUseTTS" | "reader.media-overlays.ignoreAndUseTTSDescription" | "reader.media-overlays.next" | "reader.media-overlays.pause" | "reader.media-overlays.play" | "reader.media-overlays.previous" | "reader.media-overlays.skip" | "reader.media-overlays.skipDescription" | "reader.media-overlays.speed" | "reader.media-overlays.stop" | "reader.media-overlays.title" | "reader.navigation" | "reader.navigation.ZenModeExit" | "reader.navigation.ZenModeTitle" | "reader.navigation.annotationTitle" | "reader.navigation.backHomeTitle" | "reader.navigation.bookmarkTitle" | "reader.navigation.currentPage" | "reader.navigation.currentPageTotal" | "reader.navigation.detachWindowTitle" | "reader.navigation.goTo" | "reader.navigation.goToError" | "reader.navigation.goToPlaceHolder" | "reader.navigation.goToTitle" | "reader.navigation.historyNext" | "reader.navigation.historyPrevious" | "reader.navigation.infoTitle" | "reader.navigation.magnifyingGlassButton" | "reader.navigation.openTableOfContentsTitle" | "reader.navigation.page" | "reader.navigation.pdfscalemode" | "reader.navigation.settingsTitle" | "reader.picker" | "reader.picker.search" | "reader.picker.search.founds" | "reader.picker.search.input" | "reader.picker.search.next" | "reader.picker.search.notFound" | "reader.picker.search.previous" | "reader.picker.search.results" | "reader.picker.search.submit" | "reader.picker.searchTitle" | "reader.settings" | "reader.settings.column" | "reader.settings.column.auto" | "reader.settings.column.one" | "reader.settings.column.title" | "reader.settings.column.two" | "reader.settings.customFontSelected" | "reader.settings.customizeReader" | "reader.settings.disabled" | "reader.settings.display" | "reader.settings.disposition" | "reader.settings.disposition.title" | "reader.settings.font" | "reader.settings.fontSize" | "reader.settings.infoCustomFont" | "reader.settings.justification" | "reader.settings.justify" | "reader.settings.letterSpacing" | "reader.settings.lineSpacing" | "reader.settings.margin" | "reader.settings.noFootnotes" | "reader.settings.noRTLFlip" | "reader.settings.noRuby" | "reader.settings.noTemporaryNavTargetOutline" | "reader.settings.paginated" | "reader.settings.paraSpacing" | "reader.settings.pdfZoom" | "reader.settings.pdfZoom.name" | "reader.settings.pdfZoom.name.100pct" | "reader.settings.pdfZoom.name.150pct" | "reader.settings.pdfZoom.name.200pct" | "reader.settings.pdfZoom.name.300pct" | "reader.settings.pdfZoom.name.500pct" | "reader.settings.pdfZoom.name.50pct" | "reader.settings.pdfZoom.name.fit" | "reader.settings.pdfZoom.name.width" | "reader.settings.pdfZoom.title" | "reader.settings.preset" | "reader.settings.preset.apply" | "reader.settings.preset.applyDetails" | "reader.settings.preset.detail" | "reader.settings.preset.reset" | "reader.settings.preset.resetDetails" | "reader.settings.preset.save" | "reader.settings.preset.saveDetails" | "reader.settings.preset.title" | "reader.settings.preview" | "reader.settings.reduceMotion" | "reader.settings.scrolled" | "reader.settings.spacing" | "reader.settings.text" | "reader.settings.theme" | "reader.settings.theme.name" | "reader.settings.theme.name.Contrast1" | "reader.settings.theme.name.Contrast2" | "reader.settings.theme.name.Contrast3" | "reader.settings.theme.name.Contrast4" | "reader.settings.theme.name.Neutral" | "reader.settings.theme.name.Night" | "reader.settings.theme.name.Paper" | "reader.settings.theme.name.Sepia" | "reader.settings.theme.title" | "reader.settings.wordSpacing" | "reader.svg" | "reader.svg.left" | "reader.svg.right" | "reader.toc" | "reader.toc.publicationNoToc" | "reader.tts" | "reader.tts.activate" | "reader.tts.language" | "reader.tts.next" | "reader.tts.options" | "reader.tts.pause" | "reader.tts.play" | "reader.tts.previous" | "reader.tts.sentenceDetect" | "reader.tts.sentenceDetectDescription" | "reader.tts.speed" | "reader.tts.stop" | "reader.tts.voice" | "settings" | "settings.annotationCreator" | "settings.annotationCreator.creator" | "settings.annotationCreator.help" | "settings.annotationCreator.name" | "settings.annotationCreator.organization" | "settings.annotationCreator.person" | "settings.annotationCreator.type" | "settings.auth" | "settings.auth.help" | "settings.auth.title" | "settings.auth.wipeData" | "settings.keyboard" | "settings.keyboard.advancedMenu" | "settings.keyboard.cancel" | "settings.keyboard.disclaimer" | "settings.keyboard.editUserJson" | "settings.keyboard.keyboardShortcuts" | "settings.keyboard.loadUserJson" | "settings.keyboard.resetDefaults" | "settings.keyboard.save" | "settings.language" | "settings.language.languageChoice" | "settings.library" | "settings.library.enableAPIAPP" | "settings.library.title" | "settings.session" | "settings.session.title" | "settings.tabs" | "settings.tabs.appearance" | "settings.tabs.general" | "settings.tabs.keyboardShortcuts" | "settings.theme" | "settings.theme.auto" | "settings.theme.dark" | "settings.theme.description" | "settings.theme.light" | "settings.theme.title" | "tts" | "tts.highlight" | "tts.highlight.mainColor" | "tts.highlight.maskBlockWordOutline" | "tts.highlight.maskBlockWordSolidBackground" | "tts.highlight.maskBlockWordUnderline" | "tts.highlight.maskWordOutline" | "tts.highlight.maskWordSolidBackground" | "tts.highlight.maskWordUnderline" | "tts.highlight.outlineWordOutline" | "tts.highlight.outlineWordSolidBackground" | "tts.highlight.outlineWordUnderline" | "tts.highlight.preview" | "tts.highlight.solidBackgroundWordOutline" | "tts.highlight.solidBackgroundWordSolidBackground" | "tts.highlight.solidBackgroundWordUnderline" | "tts.highlight.style" | "tts.highlight.underlineWordOutline" | "tts.highlight.underlineWordSolidBackground" | "tts.highlight.underlineWordUnderline" | "tts.highlight.wordColor" | "wizard" | "wizard.buttons" | "wizard.buttons.discover" | "wizard.buttons.goToBooks" | "wizard.buttons.next" | "wizard.description" | "wizard.description.annotations" | "wizard.description.catalogs" | "wizard.description.home" | "wizard.description.readingView1" | "wizard.description.readingView2" | "wizard.description.yourBooks" | "wizard.dontShow" | "wizard.tab" | "wizard.tab.annotations" | "wizard.tab.catalogs" | "wizard.tab.home" | "wizard.tab.readingView" | "wizard.tab.yourBooks" | "wizard.title" | "wizard.title.allBooks" | "wizard.title.newFeature" | "wizard.title.welcome";
}
export = typed_i18n_keys;