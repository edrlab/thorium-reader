# test-suite 

Thorium test suite 



## test 1 / library open with wizard welcome screen

- name: open library window

- platforms: win

- version: 3.4

- goal: open electron library browser window

- prerequisite: 

  - appData cleared

- steps: 

  * start thorium

- expected result:

  welcome screen Thorium 3.4

![image-20260314145123755](./image-20260314145123755.png)



- post steps: 
  - click on Don't show again
    - ![image-20260314150512092](./image-20260314150512092.png)
  - click on Go to my publication
- expected results: 

![image-20260314145426348](./image-20260314145426348.png)



## test 2 / library menu navigation

- prerequisite: Test1
- steps:
  - start thorium

- expected result:
  - All publications
    -  ![image-20260314150710962](./image-20260314150710962.png)
  - All catalogs
    -  ![image-20260314150754109](./image-20260314150754109.png)
  - Settings
    - ![image-20260314150929462](./image-20260314150929462.png)



## test3 / library home "import a publication"

- prerequisite: 

  - Test1
  - [accessible_epub_3.epub](accessible_epub_3.epub) 

- steps:

  -  click on "import publication"
  - select accessible epub3 epub file

- expected result:

  - import the publication

    ![image-20260314151837092](./image-20260314151837092.png)

## test4 / publication catalog menu

- prerequisite: 
  - Test3
- steps:
  - click on the publication catalog menu icon (3 vertical small points)
- expected result:
  - catalog menu overlay

![image-20260314152035819](./image-20260314152035819.png)

![image-20260314152054521](./image-20260314152054521.png)



## test5 / library about publication modal

- prerequisite: 
  - Test4
- steps:
  - click on "About publication"

![image-20260314152240177](./image-20260314152240177.png)



## test6 / library about publication / read

- prerequisite: 

  - Test5

- steps:

  - click on "Read"

- expected result:

  - open the reader browser window

    ![image-20260314152421506](./image-20260314152421506.png)

  - library window is still open in background



## test7 / library about publication / delete

- prerequisite: 

  - Test5

- steps:

  - click on "Delete"

    ![image-20260314152615965](./image-20260314152615965.png)

- expected results:

  - Click on Cancel dismiss the Delete publication modal and do nothing
  - Click on Yes remove the publication and come back to home library
    - ![image-20260314145426348](./image-20260314145426348.png)v



## test8 / library about publication / save as

- prerequisite: 
  - Test5
- steps:
  - click on "save as"
- expected results: 
  - open the file explorer to export the publication to a specific file pathname
  - select a temporary directory
  - export the publication
  - check if the publication is exported to the disk





## test9 / library catalog menu / delete

- prerequisite: 
  - Test4
- steps:
  - click on "delete"

- expected results: 
  - same expected results as test7 



## test10 / library catalog menu / save as

- prerequisite: 
  - Test4
- steps:
  - click on "save as"

- expected results: 
  - same expected results as test8



## test11 / library all publications / one publication

- prerequisite: 
  - Test3
- steps:
  - click on "All publication" on the left menu section
- expected results:
  - ![image-20260314153353364](./image-20260314153353364.png)



## test12 / library all publications 

- prerequisite: 
  - Test11
- steps:
  - click on the catalog menu of the publication
- expected results:
  - same as Test4 catalog menu tests



## test13 / library all publications table view

- prerequisite: 

  - Test11

- steps:

  - click on Table on the top menu, grid must be selected by default

- expected results:

  - same as Test4 catalog menu tests

    ![image-20260314154203604](./image-20260314154203604.png)



## test15 / one reader with "accessible epub3" opened

- prerequisite: 

  - Test3

- steps:

  - click on the accessible epub 3 publication cover

- expected result:

  - open the reader browser window with the library window in background hided by the reader window

    ![image-20260314152421506](./image-20260314152421506.png)



## test16 / reader back to bookshelf

- prerequisite: 
  - Test15
- steps:
  - click on the back to bookshelf menu button

![image-20260314155433305](./image-20260314155433305.png)

-  expected result:
  - close the reader and focus on library window



## test17 / reader publication info



- prerequisite: 

  - Test15

- steps:

  - click on the publication info icon in top left corner

- expected results:

  - publication info modal

    ![image-20260314161039052](./image-20260314161039052.png)

## test18 / reader start tts

- prerequisite: 
  - Test15
- steps:
  - click on the activate tts icon in top middle
- expected results:
  - display tts buttons in place of activate tts icon 

![image-20260314161130410](./image-20260314161130410.png)





## test19 / reader tts options

- prerequisite: 
  - Test15
- steps:
  - click on the options tts icon in top middle
- expected results:
  - display tts options overlay menu
  - ![image-20260314161344050](./image-20260314161344050.png)



## test20 / reader search publication

- prerequisite: 
  - Test15
- steps:
  - click on the search publication icon in top right
- expected results:
  - display search bar on top of the publication content
  - ![image-20260314161454436](./image-20260314161454436.png)



## test21 / reader bookmark

- prerequisite: 
  - Test15
- steps:
  - click on the bookmark icon in top right
- expected results:
  - bookmark the first locator position on the publication content 
  - ![image-20260314161602481](./image-20260314161602481.png)



## test22 / reader note

- prerequisite: 
  - Test15
- steps:
  - click on the note icon in top right
- expected results:
  - dispatch a toast error notification with "no selection"
  - ![image-20260314161713706](./image-20260314161713706.png)



## test23 / reader navigation



- prerequisite: 
  - Test15
- steps:
  - click on the navigation icon in top right
- expected results:
  - open the navigation modal 
  - ![image-20260314161820164](./image-20260314161820164.png)



## test24 / reader settings

- prerequisite: 
  - Test15
- steps:
  - click on the settings icon in top right
- expected results:
  - open the navigation modal 
  - ![image-20260314161906096](./image-20260314161906096.png)



## test25 / reader locator change

- prerequisite: 
  - Test18
- steps:
  - click on the right arrow

- expected results:
  - page change
  - ![image-20260315174115611](./image-20260315174115611.png)



## test26 / reader locator persistence

- prerequisite: 
  - Test25
- steps:
  - close the reader
  - click on the publication cover - open the reader

- expected results:
  - locator didn't change and stay on the same previous page
  - ![image-20260315174328665](./image-20260315174328665.png)



## test27 / reader settings theme change

- prerequisite: 
  - Test24
- steps:
  - select sepia theme
  - close the settings modal

- expected results:
  - theme change to sepia
  - ![image-20260315174500953](./image-20260315174500953.png)

## test29 / reader settings theme persistence

- prerequisite: 
  - Test27
- steps:
  - close the reader

- expected results:
  - theme didn't change and stay on sepia
  - ![image-20260315174600134](./image-20260315174600134.png)



## test30 / reader settings customize text formatting

- prerequisite: 
  - Test15
- steps:
  - open the settings modal
  - check "customize text formatting"

- expected results:
  - Text and Spacing menu section enabled 
  - ![image-20260315174942886](./image-20260315174942886.png)



## test31 / reader settings customize text formatting persistence

- prerequisite: 
  - Test30
- steps:
  - close the reader
  - click on the publication cover - open the reader

- expected results:
  - customize text formatting checked in settings menu
  - ![image-20260315174942886](./image-20260315174942886.png)



## test32 / reader settings persistence library closed (fuzzy test)

- prerequisite: 
  - Test15
- steps:
  - click on the right arrow 3 times
  - open the settings menu
  - select sepia theme
  - select scrollable
  - alignment left 
  - check "customize text formating"
  - select text menu section
  - select font size to 200%
  - select spacing menu section
  - letter spacing 0.5 rem
  - close the reader
  - close the library
  - open thorium
  - click on the publication cover - open the reader

- expected results:
  - same settings before closing
  - ![image-20260315175944369](./image-20260315175944369.png)







