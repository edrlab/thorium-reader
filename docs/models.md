# Models

## Tag

### Interface

* uuid: string (required)
* name: string
* parentUuid: Tag

### Sample

```
{
    uuid: "eb1ec53d-ff1b-4677-bfce-bda326f159f9",
    name: "Classic",
}
```

## Catalog

### Interface

* uuid: string (required)
* title: string
* publicationModels: PublicationModel[] (required)

### Sample

```
{
    uuid: "eb1ec53d-ff1b-4677-bfce-bda326f159f9",
    title: "Classic books",
    publicationModels: [
        {
            uuid: "eb1ec53d-ff1b-4677-bfce-bda326f189e9",
            title: "Moby dick"
        }
    ]
}
```

## PublicationModel

### Interface

* uuid: string (required)
* title: string (required)
* contentType: string
* tags: Tag[]
* description: string
* languages: string
* authors: string
* fileSize: number (in bytes)
* physicalPageCount: number
* coverUrl: string

### Sample

```
{
    identifier: "eb1ec53d-ff1b-4677-bfce-bda326f189e9",
    title: "Moby dick",
    description: "Moby dick description",
    languages: ["fr"],
    authors: ["Herman Melville"],
    fileSize: 5345762,
    physicalPageNb: 234,
    coverUrl: "readium-desktop://book/eb1ec53d-ff1b-4677-bfce-bda326f189e9/cover.jpg"
}
```
