
export const noteExportHtmlMustacheTemplate = `
<!DOCTYPE html>
<!-- mustache.js template https://mustache.github.io/mustache.5.html -->
<!-- https://github.com/edrlab/thorium-reader/blob/develop/src/common/readium/annotation/htmlTemplate.ts -->
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

                    {{#body.htmlValue}}
                    <article class="markdown-body">
                        {{{body.htmlValue}}}
                    </article>
                    {{/body.htmlValue}}

                    {{#body.value}}
                    <details>
                        <summary>Text Value</summary>
                        <p lang="{{body.language}}" {{#body.format}}data-format="{{body.format}}"{{/body.format}}>
                            {{body.value}}
                        </p>
                    </details>
                    {{/body.value}}

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
