/**
 * @ignore
 * separator for button
 * @author yiminghe@gmail.com
 */
KISSY.add(function (S) {
    function Separator() {
    }

    S.augment(Separator, {
        pluginRenderUI:function (editor) {
            S.all('<span ' +
                'class="'+editor.get('prefixCls')+'editor-toolbar-separator">&nbsp;' +
                '</span>')
                .appendTo(editor.get('toolBarEl'));
        }
    });

    return Separator;
});