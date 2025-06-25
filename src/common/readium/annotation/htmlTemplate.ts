
export const noteExportHtmlMustacheTemplate = `
<!DOCTYPE html>
<!-- mustache.js template https://mustache.github.io/mustache.5.html -->
<!-- https://github.com/edrlab/thorium-reader/blob/develop/src/common/readium/annotation/htmlTemplate.ts -->
<html>
<head>
    <title>{{title}} | Annotations about{{dc:title}}</title>
    {{#generator}}
    <meta name=generator content="{{name}}" />
    <meta name="dc:identifier" content="{{id}}" />
    {{/generator}}
    {{#about}}
    <meta name="dc:date" content="{{dc:date}}" />
    {{/about}}
    <style>
        body {margin: 2rem; }
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
        <h1>{{title}} | Annotations about <cite>{{ .dc:title }}</cite></h1>
        <section class="metadata">
            {{#about}}
                <h2>Informations about the annotated publication</h2>
                {{#dc:title}}<p>Title: <cite>{{.}}</cite></p>{{/dc:title}}
                {{#dc:creator}}<p>Creator: {{.}}</p>{{/dc:creator}}
                {{#dc:publisher}}<p>Publisher: {{.}}</p>{{/dc:publisher}}
                <details>
                    <summary>More about thi spublication</summary>                                <ul>
                    {{#dc:date}}<li>Date: {{.}}</li>{{/dc:date}}
                    {{#dc:format}}<li>Format: {{.}}</li>{{/dc:format}}
                    {{#dc:identifier}}<li>Identifier: {{.}}</li>{{/dc:identifier}}
                    </ul>
                </details>
            {{/about}}
        </section>
    </header>

    <!-- Main Content - Annotations -->
    <main>
        {{#items}}
            <section class="annotation">
                <!-- Annotation Body -->
                <section class="body">
                    <h2>Annotation ID: {{body.id}}</h2>

                    {{#body.value}}
                        <blockquote lang="{{body.language}}" {{#body.format}}data-format="{{body.format}}"{{/body.format}}>
                            {{body.value}}
                        </blockquote>
                    {{/body.value}}

                    {{#body.htmlValue}}
                    <article class="markdown-body">
                        {{{body.htmlValue}}}
                    </article>
                    {{/body.htmlValue}}

                    {{#body.tag}}<p>Tag: {{body.tag}}</p>{{/body.tag}}


                <!-- Annotation Metadata -->
                    {{#body.color}}<p>Color: {{body.color}}</p>{{/body.color}}
                    {{#body.highlight}}<p>Highlight: {{body.highlight}}</p>{{/body.highlight}}
                    {{#body.textDirection}}<p>TextDirection: {{body.textDirection}}</p>{{/body.textDirection}}
                </section>

                    <!-- Creator Information -->

                <section class="creator">
                <h3>Creator</h3>
                <p><small>Created by {{creator.name}} ({{creator.id}}) ({{creator.type}}) on: {{created}} and modified on: {{modified}}</small></p>
                </section>


                <!-- Target Information -->
                <section class="target">
                    <h3>Target</h3>
                    <p>Source: {{target.source}}</p>
                    
                    {{#target.meta}}
                        <section class="meta">
                            {{#page}}<p>Page: {{page}}</p>{{/page}}
                                <h4>This annotation happens in the context of the following publication title hierarchy</h4>
                                <ul>
                                    {{#headings}}
                                    {{#.}}<li>Level {{level}}: {{txt}}</li>{{/.}}
                                    {{/headings}}
                                </ul>

                        </section>
                    {{/target.meta}}

                    <!-- Selectors -->
                    <section class="selectors">
                    <details>
                        <summary>Selectors</summary
                        {{#target.selector}}
                                <strong>{{type}}</strong>
                                <ul>
                                {{#start}}<li>Start: {{start}}</li>{{/start}}
                                {{#end}}<pli>End: {{end}}</li>{{/end}}
                                {{#exact}}<li>Exact: {{exact}}</li>{{/exact}}
                                {{#prefix}}<li>Prefix: {{prefix}}</li>{{/prefix}}
                                {{#suffix}}<li>Suffix: {{suffix}}</li>{{/suffix}}
                                {{#value}}<li>Value: {{value}}</li>{{/value}}
                                {{#conformsTo}}<li>Conforms to: {{conformsTo}}</li>{{/conformsTo}}
                                {{#refinedBy}}<div class="refined">{{> selector}}</div>{{/refinedBy}}
                                </ul>
                        {{/target.selector}}
                        </details
                    </section>
                </section>
            </section>
            {{^isLast}}<hr>{{/isLast}}
        {{/items}}
    </main>

    <footer>

        {{#generated}}
        <p><strong>Generated by 
        {{#homepage}} Homepage: <a href="{{homepage}}">{{homepage}}</a><{{/homepage}} 
        on:</strong> {{generated}}</p>{{/generated}}
         <p><strong><strong>ID:</strong> {{id}} | Context:</strong> {{@context}} | <strong>Type:</strong> {{type}}</p>     
            {{#generator}}
            <section class="generator">
            <details>
            <summary>
                <h3>Generator</h3>
            </summary>
                <p>ID: {{id}} | Type: {{type}} | Name: {{name}}</p   
            </section>
            {{/generator}}
    </footer>
</body>
</html>
`;
