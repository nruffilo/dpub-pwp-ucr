function rev_index() {

    var indexes_to_references = function(element, ref_list) {
        element.html(
            $.map(ref_list, function(ref) {
                return "<a href='#" + ref + "'></a>"
            })
            .join(", ")
        )
    };

    // structure to store the references. For each reference an array of @id values are stored
    var refs = {}

    // 1. Collect the references from <a> elements that have a specific attribute set
    $("a[data-set-anchor]").each(function(i) {
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

        // Get the content of the <a> element, this is the reference
        // Relying the respec tool of <a>bla</a> - <dfn>bla</bla>
        // TODO: consider the data-lt alternative
        var ref_text = $(this).text()        //
        // Filling the value of the reference structure
        if( refs[ref_text] === undefined ) {
            refs[ref_text] = [ref_id]
        } else {
            refs[ref_text].push(ref_id)
        }
    });

    // alert(JSON.stringify(refs));

    $("[data-ref-anchor]").each(function(i) {
        // Get the content of the element; that should be the key to the references
        var ref_text = $(this).text();
        // See if the reference is really set
        if( refs[ref_text] !== undefined ) {
            // Remove current content:
            $(this).text("");
            // Generate references for later respec manipulation, and turn this into a series
            // of HTML elements to be displayed.
            indexes_to_references($(this), refs[ref_text]);
        }
    });

    // Generate tables
    $("tbody[data-list-anchors]").each(function(i) {
        var tbody = $(this);
        // Sort the keys and, for each of that, generate a table row with
        // 1. cell with the key, referring back to the definition of the key
        // 2. cell with the references to the use cases where it was used
        Object.keys(refs).sort().forEach(function(key, index, array){
            // alert(key);
            tr = $("<tr></tr>");
            tbody.append(tr);

            td1 = $("<td></td>");
            tr.append(td1);
            td1.html("<a>" + key + "</a>");

            td2 = $("<td></td>");
            tr.append(td2);
            indexes_to_references(td2, refs[key]);
        });
    });
}
