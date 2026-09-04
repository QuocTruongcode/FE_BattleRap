import {
    MDXEditor,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    tablePlugin,
    linkPlugin,
    linkDialogPlugin,
    imagePlugin,
    codeBlockPlugin,
    codeMirrorPlugin,
    toolbarPlugin,
    UndoRedo,
    BoldItalicUnderlineToggles,
    BlockTypeSelect,
    CreateLink,
    InsertImage,
    InsertTable,
    ListsToggle,
    CodeToggle,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { forwardRef } from 'react';

const EditReview = forwardRef(({ markdown, onChange }, ref) => {
    return (
        <MDXEditor
            ref={ref}
            markdown={markdown}
            onChange={onChange}
            plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                thematicBreakPlugin(),
                linkPlugin(),
                linkDialogPlugin(),
                imagePlugin(),
                tablePlugin(),
                codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
                codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', html: 'HTML' } }),
                markdownShortcutPlugin(), // gõ ## rồi space -> tự thành H2, v.v.
                toolbarPlugin({
                    toolbarContents: () => (
                        <>
                            <UndoRedo />
                            <BoldItalicUnderlineToggles />
                            <BlockTypeSelect />
                            <CodeToggle />
                            <ListsToggle />
                            <CreateLink />
                            <InsertImage />
                            <InsertTable />
                        </>
                    ),
                }),
            ]}
        />
    );
});

export default EditReview;
