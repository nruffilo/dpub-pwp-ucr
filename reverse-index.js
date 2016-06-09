/****************************************************************
* Function to be executed by respec before any respec processing
****************************************************************/
function rev_index() {

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

    alert(JSON.stringify(refs, null, 2));

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
            td1 = $("<td class='anchor-list-row-req'></td>");
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
