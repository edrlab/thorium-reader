
// const __htmlMustacheTemplate = `
// <!DOCTYPE html>
// <html>
// <head>
//     <title>{{#title}}{{title}}{{/title}}{{^title}}Annotations{{/title}}</title>
// </head>
// <body>
//     <h1>{{#title}}{{title}}{{/title}}{{^title}}Annotations{{/title}}</h1>

//     <div class="metadata">
//         <p><strong>ID:</strong> <a href="{{id}}">{{id}}</a></p>
//         <p><strong>Type:</strong> {{type}}</p>

//         {{#generated}}
//         <p><strong>Generated:</strong> {{generated}}</p>
//         {{/generated}}
//     </div>

//     <div class="generator">
//         <h2>Generator</h2>
//         <p><strong>Name:</strong> {{generator.name}}</p>
//         <p><strong>ID:</strong> {{generator.id}}</p>
//         <p><strong>Type:</strong> {{generator.type}}</p>
//         {{#generator.homepage}}
//         <p><strong>Homepage:</strong> <a href="{{generator.homepage}}">{{generator.homepage}}</a></p>
//         {{/generator.homepage}}
//     </div>

//     <div class="about">
//         <h2>Publication Details</h2>

//         <p><strong>Identifiers:</strong></p>
//         <ul>
//         {{#about.dc:identifier}}
//         <li>{{.}}</li>
//         {{/about.dc:identifier}}
//         </ul>

//         {{#about.dc:title}}
//         <p><strong>Title:</strong> {{about.dc:title}}</p>
//         {{/about.dc:title}}

//         {{#about.dc:format}}
//         <p><strong>Format:</strong> {{about.dc:format}}</p>
//         {{/about.dc:format}}

//         {{#about.dc:date}}
//         <p><strong>Date:</strong> {{about.dc:date}}</p>
//         {{/about.dc:date}}

//         {{#about.dc:publisher}}
//         <p><strong>Publishers:</strong></p>
//         <ul>
//         {{#about.dc:publisher}}
//         <li>{{.}}</li>
//         {{/about.dc:publisher}}
//         </ul>
//         {{/about.dc:publisher}}

//         {{#about.dc:creator}}
//         <p><strong>Creators:</strong></p>
//         <ul>
//         {{#about.dc:creator}}
//         <li>{{.}}</li>
//         {{/about.dc:creator}}
//         </ul>
//         {{/about.dc:creator}}
//     </div>

//     <div class="annotation-set">
//         {{#items}}
//         <div class="annotation">
//             <h2>Annotation: {{id}}</h2>
//             <p>Created: {{created}}</p>
//             {{#modified}}<p>Modified: {{modified}}</p>{{/modified}}
            
//             {{#creator}}
//             <div class="creator">
//                 <h3>Creator</h3>
//                 <p>ID: {{id}}</p>
//                 <p>Type: {{type}}</p>
//                 {{#name}}<p>Name: {{name}}</p>{{/name}}
//             </div>
//             {{/creator}}

//             {{#body}}
//             <div class="body-content">
//                 <h3>Content</h3>
//                 <p>{{value}}</p>
//                 {{#tag}}<p>Tag: {{tag}}</p>{{/tag}}
//                 {{#highlight}}<p>Highlight Style: {{highlight}}</p>{{/highlight}}
//                 {{#color}}<p>Color: {{color}}</p>{{/color}}
//             </div>
//             {{/body}}

//             <div class="target">
//                 <h3>Target</h3>
//                 <p>Source: {{target.source}}</p>
                
//                 {{#target.meta}}
//                     {{#headings}}
//                     <div class="headings">
//                         <h4>Headings</h4>
//                         <ul>
//                             {{#.}}
//                             <li>Level {{level}}: {{txt}}</li>
//                             {{/.}}
//                         </ul>
//                     </div>
//                     {{/headings}}
//                     {{#page}}<p>Page: {{page}}</p>{{/page}}
//                 {{/target.meta}}

//                 {{#target.selector}}
//                 <div class="selectors">
//                     <h4>Selectors</h4>
//                     <ul>
//                         {{#.}}
//                         <li>Type: {{type}}</li>
//                         {{/.}}
//                     </ul>
//                 </div>
//                 {{/target.selector}}
//             </div>
//         </div>
//         <hr/>
//         {{/items}}
//     </div>
// </body>
// </html>
// `;
export const noteExportHtmlMustacheTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>{{title}} - Annotations</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2rem; }
        header, footer { color: #666; padding: 1rem; }
        .metadata { background-color: #f8f9fa; padding: 1rem; margin: 1rem 0; }
        .annotation { margin: 2rem 0; padding: 1rem; border-left: 4px solidrgb(150, 150, 150); }
        .selector { background-color: #f5f5f5; padding: 1rem; margin: 1rem 0; }
        .highlight { padding: 0.2em; }
    </style>
</head>
<body>
    <!-- Header Section with Collection Metadata -->
    <header>
        <h1>{{title}}</h1>
        <div class="metadata">
            <p><strong>Context:</strong> {{@context}}</p>
            <p><strong>ID:</strong> {{id}}</p>
            <p><strong>Type:</strong> {{type}}</p>
            
            {{#generator}}
            <div class="generator">
                <h3>Generator</h3>
                <p>ID: {{id}}</p>
                <p>Type: {{type}}</p>
                <p>Name: {{name}}</p>
                {{#homepage}}<p>Homepage: <a href="{{homepage}}">{{homepage}}</a></p>{{/homepage}}
            </div>
            {{/generator}}

            {{#about}}
            <div class="metadata">
                <h3>Publication Metadata</h3>
                {{#dc:identifier}}<p>Identifier: {{.}}</p>{{/dc:identifier}}
                {{#dc:format}}<p>Format: {{.}}</p>{{/dc:format}}
                {{#dc:title}}<p>Title: {{.}}</p>{{/dc:title}}
                {{#dc:publisher}}<p>Publisher: {{.}}</p>{{/dc:publisher}}
                {{#dc:creator}}<p>Creator: {{.}}</p>{{/dc:creator}}
                {{#dc:date}}<p>Date: {{.}}</p>{{/dc:date}}
            </div>
            {{/about}}

        </div>
    </header>

    <!-- Main Content - Annotations -->
    <main>
        {{#items}}
            <div class="annotation">
                <!-- Annotation Metadata -->
                <h2>{{motivation}}</h2>
                <p><small>Created: {{created}}</small></p>
                {{#modified}}<p><small>Modified: {{modified}}</small></p>{{/modified}}

                <!-- Creator Information -->
                <div class="creator">
                    <h3>Creator</h3>
                    <p>{{creator.name}} ({{creator.id}})</p>
                    <p>Type: {{creator.type}}</p>
                </div>

                <!-- Annotation Body -->
                <div class="body">
                    <h3>Content</h3>
                    {{#body.color}}<p>Color: {{body.color}}</p>{{/body.color}}
                    {{#body.highlight}}<p>Highlight: {{body.highlight}}</p>{{/body.highlight}}
                    {{#body.textDirection}}<p>TextDirection: {{body.textDirection}}</p>{{/body.textDirection}}

                    <p lang="{{body.language}}" {{#body.format}}data-format="{{body.format}}"{{/body.format}}>
                        {{body.value}}
                    </p>
                    {{#body.tag}}<p>Tag: {{body.tag}}</p>{{/body.tag}}
                </div>

                <!-- Target Information -->
                <div class="target">
                    <h3>Target</h3>
                    <p>Source: {{target.source}}</p>
                    
                    {{#target.meta}}
                        <div class="meta">
                            {{#page}}<p>Page: {{page}}</p>{{/page}}
                            {{#headings}}
                                <h4>Headings</h4>
                                <ul>
                                    {{#.}}<li>Level {{level}}: {{txt}}</li>{{/.}}
                                </ul>
                            {{/headings}}
                        </div>
                    {{/target.meta}}

                    <!-- Selectors -->
                    <div class="selectors">
                        <h4>Selectors</h4>
                        {{#target.selector}}
                            <div class="selector">
                                <strong>{{type}}</strong>
                                {{#start}}<p>Start: {{start}}</p>{{/start}}
                                {{#end}}<p>End: {{end}}</p>{{/end}}
                                {{#exact}}<p>Exact: {{exact}}</p>{{/exact}}
                                {{#prefix}}<p>Prefix: {{prefix}}</p>{{/prefix}}
                                {{#suffix}}<p>Suffix: {{suffix}}</p>{{/suffix}}
                                {{#value}}<p>Value: {{value}}</p>{{/value}}
                                {{#conformsTo}}<p>Conforms to: {{conformsTo}}</p>{{/conformsTo}}
                                {{#refinedBy}}<div class="refined">{{> selector}}</div>{{/refinedBy}}
                            </div>
                        {{/target.selector}}
                    </div>
                </div>
            </div>
            {{^isLast}}<hr>{{/isLast}}
        {{/items}}
    </main>

    <footer>

        {{#generated}}<p><strong>Generated:</strong> {{generated}}</p>{{/generated}}
    </footer>
</body>
</html>
`;
