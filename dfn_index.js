/*******************************************************************************************
Facilitating back references and listings of definitions in respec.
===================================================================

Built on top of the respec idiom of using <a data-lt="...">...</a> paired with <dfn> elements
(see https://www.w3.org/respec/guide.html#definitions-and-linking) insofar as
one can generate, for a specific definition, the list of section references where that <dfn> is used.
Useful, for example, in UCR specifications, where the use cases refer to a specific requirement, and it is
important to have a 'back' link from each requirement (using a <dfn>) to the sections where
the requirement is mentioned.

The function is to be used _before_ any respec processing: it indeed adds (if necessary) some @id attributes and
generates elements that make use of respec functionalities.

Usage in the HTML source
========================

1. When using a <a data-lt="...">...</a> in the code (where the usage of @data-lt is optional), adding the
data-set-anchor attribute to <a> (the value of the attribute is not important) means the section @id will be
stored for later reference. More precisely, the script locates the first header of the closest enclosing <section>
element. The script uses the @id of the <section> (if available) or that of the header
(if there is no @id, it is added to the header). This @id is used for back linking.

2. Any element (typically a <span>, but can be anything else) of the form:

   <span data-ref-anchor data-lt="...">...</a>

(@data-lt is optional) that identifies a definition exactly the same way as an <a> would do will be transformed.
The content of the element is exchanged against a (comma separated) list of <a> elements that refer to the
@id-s where the definition is referred to. Note that what is generated is elements of the form

   <a id="#id"></a>

 making use of the section linking facility of respec (ie, the title of the section, as well as its numbering
is automatically reused)

3. It is also possible to generate a table of references. Any table body of the form:

    <tbody data-list-anchors></tbody>

is transformed by adding a series of table rows, each consisting of two table cells. The first (leftmost) cells
contains a reference to a definition, the second cell contains a comma separate list of section references (similarly
to the format used above). To facilitate table styling, the classes anchor-list-row, anchor-list-row-dfn,
and anchor-list-row-sections classes are added to the row, the left and right cells, respectively.

Configuring respec
==================

The script must be linked into the code as any other js file:

    <script src='dfn_index.js' class='remove'></script>

Furthermore, the function 'dfn_index' must be added to the respec configuration for preprocessing, ie,

    preProcess: [dfn_index],



Author: Ivan Herman, W3C, ivan@w3.org
Version: 0.8
Date: 2016-06-09

*******************************************************************************************/



/**********************************************************************
* Function to be executed by respec before any other respec processing
**********************************************************************/
function dfn_index() {

    /****************************************************************************************
    * 1. Get an array of identification structures for all the <dfn> elements
    *****************************************************************************************/
    var lt_to_array = function(lt) {
        return lt === undefined ? [] : lt.split("|")
    };
    var defs = $.map($("dfn"), function(el) {
        return {
            text   : el.textContent,
            data_lt: lt_to_array(el.dataset.lt)
        }
    });

    /*****
    * Helper function: locate the dfn element that is referred to either via a text or a data-lt attribute
    *****/
    var return_def = function(element, structures) {
        for( var i = 0; i < structures.length; i++ ) {
            var struct = structures[i];
            var text    = element.text();
            var data_lt = element.data("lt");
            if( (data_lt !== undefined && $.inArray(data_lt, struct.data_lt) >= 0) || text === struct.text ) {
                return i;
            }
        }
        return undefined
    }
    // alert(JSON.stringify(defs, null, 2));

    /****************************************************************************************
    * 2. Collect the references from <a> elements that have a specific attribute set
    *****************************************************************************************/
    var refs = {}
    $("a[data-set-anchor]").each(function(i) {
        // 2.1. Find/set the @id to be used to link 'back' to this section. Stored in ref_id
        var ref_id = undefined;
        // Looking for the closest parent <section> and its header, and get or set the @id value
        $(this).parents("section").each(function(j) {
            if(j === 0) {
                $section = $(this)
                ref_id = $section.attr("id");
                if( ref_id === undefined ) {
                    // must find the header for that section
                    $section.children(":header").each(function(k){
                        if( k === 0 ) {
                            // This must be the header of the section.
                            // If there is no id on the header, the respec approach is simulated
                            // otherwise the header is reused by extending it by "s-"
                            ref = $(this).attr("id")
                            if( ref_id === undefined ) {
                                ref_id = $(this).makeID("h");
                            }
                        }
                    });
                }
            }
        });

        // 2.2. Identify the <dfn> element that this <a> links to. If it is undefined, abort the cycle...
        var def_index = return_def($(this), defs);
        if( def_index === undefined ) return;

        // 2.3. The refs structure uses the def_index as a key, and the value is an array of @id values.
        if( refs[def_index] === undefined ) {
            refs[def_index] = [ref_id]
        } else {
            refs[def_index].push(ref_id)
        }
    });

    // alert(JSON.stringify(refs, null, 2));

    /****************************************************************************************
    * 3. Handle the direct back references to a sections, using the same reference as for a <dfn>;
    * replace the content with a list of <a> elements without any content (using the respec trick to
    * pick up section numbering and section title)
    *****************************************************************************************/
     $("[data-ref-anchor]").each(function(i) {
        // 3.1. Get the index for the relevant <dfn> in the structure
        var def_index = return_def($(this), defs);
        if( def_index === undefined ) return;

        // 3.2. The index should get the right value in the refs structure, revealing an array of section @indexes_to_references
        var ids = refs[def_index];
        if( ids === undefined ) return;

        // 3.3. Replace the content of the element with back references
        $(this).text("");
        $(this).html(
            $.map(ids, function(oneref) {
                return "<a href='#" + oneref + "'></a>"
            })
            .join(", ")
        );
    });

    /****************************************************************************************
    * 4. Generate table body
    * replace the content with a list of <a> elements without any content (using the respec trick to
    * pick up section numbering and section title)
    *****************************************************************************************/
    $("tbody[data-list-anchors]").each(function(i) {
        var tbody = $(this);

        // 4.1 sort the keys into the list of <defs> to get the requirements listed in alphabetical order
        var sorted_keys = Object.keys(refs).sort(function(a,b) {
            if( defs[a].text < defs[b].text ) {
                return -1;
            } else if (defs[a].text > defs[b].text ) {
                return 1;
            } else {
                return 0;
            }
        });

        // 4.2 display the list of references for each requirement
        sorted_keys.forEach( function(index) {
            req = defs[index].text;
            ids = refs[index]

            // build the table row
            tr = $("<tr class='anchor-list-row'></tr>");
            tbody.append(tr);

            // Left cell: reference to the requirement
            td1 = $("<td class='anchor-list-row-dfn'></td>");
            tr.append(td1);
            td1.html("<a>" + req + "</a>");

            // Right cell: list of sections
            td2 = $("<td class='anchor-list-row-sections'></td>");
            tr.append(td2);
            td2.html(
                $.map(ids, function(oneref) {
                    return "<a href='#" + oneref + "'></a>"
                })
                .join(", ")
            );
        });
    });
}
