/*
Copyright 2014, KISSY v1.49
MIT Licensed
build time: May 22 12:21
*/
KISSY.add("editor/plugin/fake-objects",["editor","html-parser"],function(e,j){var m=j("editor"),l=j("html-parser"),h=e.Node,n=e.DOM,o=m.Utils.debugUrl("theme/spacer.gif");m.addMembers({createFakeElement:function(a,b,c,d,p,k){var f=a.attr("style")||"";a.attr("width")&&(f="width:"+a.attr("width")+"px;"+f);a.attr("height")&&(f="height:"+a.attr("height")+"px;"+f);var g=e.trim(a.attr("class")),a={"class":b+" "+g,src:o,_ke_real_element:encodeURIComponent(p||a.outerHtml()),_ke_real_node_type:a[0].nodeType,
style:f};k&&(delete k.width,delete k.height,e.mix(a,k,!1));c&&(a._ke_real_element_type=c);d&&(a._ke_resizable=d);return new h("<img/>",a,this.get("document")[0])},restoreRealElement:function(a){if(parseInt(a.attr("_ke_real_node_type"),10)!==n.NodeType.ELEMENT_NODE)return null;var a=e.urlDecode(a.attr("_ke_real_element")),b=new h("<div>",null,this.get("document")[0]);b.html(a);return b.first().remove()}});var q={tags:{$:function(a){var b=a.getAttribute("_ke_real_element"),c;b&&(c=(new l.Parser(e.urlDecode(b))).parse());
if(b=c&&c.childNodes[0]){if(c=a.getAttribute("style")){var d=/(?:^|\s)width\s*:\s*(\d+)/i.exec(c),a=d&&d[1];c=(d=/(?:^|\s)height\s*:\s*(\d+)/i.exec(c))&&d[1];a&&b.setAttribute("width",a);c&&b.setAttribute("height",c)}return b}}}};return{init:function(a){var b=a.htmlDataProcessor,c=b&&b.htmlFilter;b.createFakeParserElement||(c&&c.addRules(q),e.mix(b,{restoreRealElement:function(d){if(parseInt(d.attr("_ke_real_node_type"),10)!==n.NodeType.ELEMENT_NODE)return null;var d=e.urlDecode(d.attr("_ke_real_element")),
b=new h("<div>",null,a.get("document")[0]);b.html(d);return b.first().remove()},createFakeParserElement:function(a,b,c,f,g){var h=l.serialize(a),i=a.getAttribute("style")||"";a.getAttribute("width")&&(i="width:"+a.getAttribute("width")+"px;"+i);a.getAttribute("height")&&(i="height:"+a.getAttribute("height")+"px;"+i);var j=e.trim(a.getAttribute("class")),a={"class":b+" "+j,src:o,_ke_real_element:encodeURIComponent(h),_ke_real_node_type:a.nodeType+"",style:i,align:a.getAttribute("align")||""};g&&(delete g.width,
delete g.height,e.mix(a,g,!1));c&&(a._ke_real_element_type=c);f&&(a._ke_resizable="_ke_resizable");return new l.Tag("img",a)}}))}}});
