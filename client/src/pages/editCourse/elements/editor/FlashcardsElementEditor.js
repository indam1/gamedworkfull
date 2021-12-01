import React, {useContext, useEffect, useRef} from "react";
import {Group, Rect, Text, Transformer} from "react-konva";
import {Html} from "react-konva-utils";
import {useWindowDimensions} from "../../functions/Functions";
import {StageStoreContext} from "../../stores/stageStore";
import {observer} from "mobx-react";
import {toJS} from "mobx";

function FlashcardsElementEditor({shapeProps, isSelected, onSelect, onChange}) {
    const shapeRef = useRef();
    const trRef = useRef();
    const themeRef = useRef();
    const wordRef = useRef();
    const meaningRef = useRef();
    const resultRef = useRef();
    const buttonRef = useRef();
    const inputRef = useRef();

    const {mainWidth, mainHeight} = useWindowDimensions();
    const stageStore = useContext(StageStoreContext)

    useEffect(() => {
        if (isSelected) {
            // we need to attach transformer manually
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (

        <React.Fragment>
            <Group
                name={"object Flashcards"}
                onMouseDown={onSelect}
                onTap={onSelect}
                ref={shapeRef}
                {...shapeProps}

                onDragEnd={(e) => {
                    if (e.target.name() === 'object Flashcards') {
                        onChange({
                            ...shapeProps,
                            x: e.target.x(),
                            y: e.target.y(),
                        });
                    }
                }}

                onTransformEnd={(e) => {
                    const scaleX = e.target.scaleX();
                    const scaleY = e.target.scaleY();

                    e.target.scaleX(1);
                    e.target.scaleY(1);

                    onChange({
                        ...shapeProps,
                        x: e.target.x(),
                        y: e.target.y(),
                        width: e.target.width() * scaleX,
                        height: e.target.height() * scaleY,
                    })
                }}
                draggable
            >
                <Rect
                    {...shapeProps}
                    name={"object Flashcards"}
                    x={0}
                    y={0}
                />
                <Text
                    fontFamily={shapeProps.theme.fontFamily}
                    x={shapeProps.theme.x}
                    y={shapeProps.theme.y}
                    draggable
                    name={"object Theme"}
                    listening
                    text={shapeProps.theme.text}
                    fill={shapeProps.theme.fill}
                    fontSize={shapeProps.theme.fontSize}
                    ref={themeRef}

                    onDragEnd={(e) => {
                        if (e.target.name() === 'object Theme') {
                            onChange({
                                ...shapeProps,
                                theme: {
                                    x: e.target.x(),
                                    y: e.target.y(),
                                    text: shapeProps.theme.text,
                                    fontSize: shapeProps.theme.fontSize,
                                    fill: shapeProps.theme.fill,
                                    fontFamily: shapeProps.theme.fontFamily,
                                },
                            });
                        }
                    }}

                    dragBoundFunc={(pos) => {
                        const ref = themeRef.current;

                        let newX, newY;
                        if (pos.x < shapeProps.x + mainWidth * 0.1)
                            newX = shapeProps.x + mainWidth * 0.1;
                        else if (pos.x > shapeProps.x + mainWidth * 0.1 + shapeProps.width - ref.width())
                            newX = shapeProps.x + mainWidth * 0.1 + shapeProps.width - ref.width();
                        else
                            newX = pos.x;

                        if (pos.y < shapeProps.y + mainHeight * 0.05)
                            newY = shapeProps.y + mainHeight * 0.05;
                        else if (pos.y > shapeProps.y + mainHeight * 0.05 + shapeProps.height - ref.height())
                            newY = shapeProps.y + mainHeight * 0.05 + shapeProps.height - ref.height();
                        else
                            newY = pos.y;

                        return {
                            x: newX,
                            y: newY,
                        }
                    }}

                    onDblClick={() => {
                        const textNode = themeRef.current;
                        const stageRef = stageStore.stageRef;

                        // hide text node and transformer:
                        textNode.visible(false);
                        trRef.current.visible(false);

                        // create textarea over canvas with absolute position
                        // first we need to find position for textarea
                        // how to find it?

                        // at first lets find position of text node relative to the stage:
                        var textPosition = textNode.absolutePosition();

                        // so position of textarea will be the sum of positions above:
                        var areaPosition = {
                            x: stageRef.current.container().offsetLeft + textPosition.x,
                            y: stageRef.current.container().offsetTop + textPosition.y,
                        };

                        // create textarea and style it
                        var textarea = document.createElement('textarea');
                        document.body.appendChild(textarea);

                        // apply many styles to match text on canvas as close as possible
                        // remember that text rendering on canvas and on the textarea can be different
                        // and sometimes it is hard to make it 100% the same. But we will try...
                        textarea.value = textNode.text();
                        textarea.style.position = 'absolute';
                        textarea.style.top = areaPosition.y + 'px';
                        textarea.style.left = areaPosition.x + 'px';
                        textarea.style.width = textNode.width() - textNode.padding() * 2 + 'px';
                        textarea.style.height =
                            textNode.height() - textNode.padding() * 2 + 5 + 'px';
                        textarea.style.fontSize = textNode.fontSize() + 'px';
                        textarea.style.border = 'none';
                        textarea.style.padding = '0px';
                        textarea.style.margin = '0px';
                        textarea.style.overflow = 'hidden';
                        textarea.style.background = 'none';
                        textarea.style.outline = 'none';
                        textarea.style.resize = 'none';
                        textarea.style.lineHeight = textNode.lineHeight();
                        textarea.style.fontFamily = textNode.fontFamily();
                        textarea.style.transformOrigin = 'left top';
                        textarea.style.textAlign = textNode.align();
                        textarea.style.color = textNode.fill();
                        var rotation = textNode.rotation();
                        var transform = '';
                        if (rotation) {
                            transform += 'rotateZ(' + rotation + 'deg)';
                        }

                        var px = 0;
                        // also we need to slightly move textarea on firefox
                        // because it jumps a bit
                        var isFirefox =
                            navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
                        if (isFirefox) {
                            px += 2 + Math.round(textNode.fontSize() / 20);
                        }
                        transform += 'translateY(-' + px + 'px)';

                        textarea.style.transform = transform;

                        // reset height
                        textarea.style.height = 'auto';
                        // after browsers resized it we can set actual value
                        textarea.style.height = textarea.scrollHeight + 3 + 'px';

                        textarea.focus();

                        function removeTextarea() {
                            onChange({
                                ...shapeProps,
                                theme: {
                                    text: textarea.value,
                                    x: shapeProps.theme.x,
                                    y: shapeProps.theme.y,
                                    fill: shapeProps.theme.fill,
                                    fontSize: shapeProps.theme.fontSize,
                                    fontFamily: shapeProps.theme.fontFamily,
                                },
                            })
                            textarea.parentNode.removeChild(textarea);
                            window.removeEventListener('click', handleOutsideClick);
                            textNode.show();
                            trRef.current.show();
                            trRef.current.forceUpdate();
                        }

                        function setTextareaWidth(newWidth) {
                            if (!newWidth) {
                                // set width for placeholder
                                newWidth = textNode.placeholder.length * textNode.fontSize();
                            }
                            // some extra fixes on different browsers
                            var isSafari = /^((?!chrome|android).)*safari/i.test(
                                navigator.userAgent
                            );
                            var isFirefox =
                                navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
                            if (isSafari || isFirefox) {
                                newWidth = Math.ceil(newWidth);
                            }

                            var isEdge =
                                document.documentMode || /Edge/.test(navigator.userAgent);
                            if (isEdge) {
                                newWidth += 1;
                            }
                            textarea.style.width = newWidth + 'px';
                        }

                        textarea.addEventListener('keydown', function (e) {
                            // hide on enter
                            // but don't hide on shift + enter
                            if (e.keyCode === 13 && !e.shiftKey) {
                                textNode.text(textarea.value);
                                removeTextarea();
                            }
                            // on esc do not set value back to node
                            if (e.keyCode === 27) {
                                removeTextarea();
                            }
                        });

                        textarea.addEventListener('keydown', function (e) {
                            var scale = textNode.getAbsoluteScale().x;
                            setTextareaWidth(textNode.width() * scale);
                            textarea.style.height = 'auto';
                            textarea.style.height = textarea.scrollHeight + textNode.fontSize() + 'px';
                        });

                        function handleOutsideClick(e) {
                            if (e.target !== textarea) {
                                textNode.text(textarea.value);
                                removeTextarea();
                            }
                        }

                        setTimeout(() => {
                            window.addEventListener('click', handleOutsideClick);
                        });
                    }}
                />
                <Text
                    fontFamily={shapeProps.word.fontFamily}
                    x={shapeProps.word.x}
                    y={shapeProps.word.y}
                    draggable
                    name={"object Word"}
                    listening
                    text={shapeProps.word.text}
                    fill={shapeProps.word.fill}
                    fontSize={shapeProps.word.fontSize}
                    align={shapeProps.word.align}
                    verticalAlign={shapeProps.word.verticalAlign}
                    ref={wordRef}


                    onDragEnd={(e) => {
                        if (e.target.name() === 'object Word') {
                            onChange({
                                ...shapeProps,
                                word: {
                                    fontFamily: shapeProps.word.fontFamily,
                                    x: e.target.x(),
                                    y: e.target.y(),
                                    text: shapeProps.word.text,
                                    fontSize: shapeProps.word.fontSize,
                                    fill: shapeProps.word.fill,
                                },
                            });
                        }
                    }}

                    dragBoundFunc={(pos) => {
                        const ref = wordRef.current;

                        let newX, newY;
                        if (pos.x < shapeProps.x + mainWidth * 0.1)
                            newX = shapeProps.x + mainWidth * 0.1;
                        else if (pos.x > shapeProps.x + mainWidth * 0.1 + shapeProps.width - ref.width())
                            newX = shapeProps.x + mainWidth * 0.1 + shapeProps.width - ref.width();
                        else
                            newX = pos.x;

                        if (pos.y < shapeProps.y + mainHeight * 0.05)
                            newY = shapeProps.y + mainHeight * 0.05;
                        else if (pos.y > shapeProps.y + mainHeight * 0.05 + shapeProps.height - ref.height())
                            newY = shapeProps.y + mainHeight * 0.05 + shapeProps.height - ref.height();
                        else
                            newY = pos.y;

                        return {
                            x: newX,
                            y: newY,
                        }
                    }}
                />
                <Text
                    fontFamily={shapeProps.meaning.fontFamily}
                    x={shapeProps.meaning.x}
                    y={shapeProps.meaning.y}
                    draggable
                    name={"object Meaning"}
                    listening
                    text={shapeProps.meaning.text}
                    fill={shapeProps.meaning.fill}
                    fontSize={shapeProps.meaning.fontSize}
                    align={shapeProps.meaning.align}
                    verticalAlign={shapeProps.meaning.verticalAlign}
                    ref={meaningRef}

                    onDragEnd={(e) => {
                        if (e.target.name() === 'object Meaning') {
                            onChange({
                                ...shapeProps,
                                meaning: {
                                    x: e.target.x(),
                                    y: e.target.y(),
                                    text: shapeProps.meaning.text,
                                    fontFamily: shapeProps.meaning.fontFamily,
                                    fontSize: shapeProps.meaning.fontSize,
                                    fill: shapeProps.meaning.fill,
                                },
                            });
                        }
                    }}

                    dragBoundFunc={(pos) => {
                        const ref = meaningRef.current

                        let newX, newY;
                        if (pos.x < shapeProps.x + mainWidth * 0.1)
                            newX = shapeProps.x + mainWidth * 0.1;
                        else if (pos.x > shapeProps.x + mainWidth * 0.1 + shapeProps.width - ref.width())
                            newX = shapeProps.x + mainWidth * 0.1 + shapeProps.width - ref.width();
                        else
                            newX = pos.x;

                        if (pos.y < shapeProps.y + mainHeight * 0.05)
                            newY = shapeProps.y + mainHeight * 0.05;
                        else if (pos.y > shapeProps.y + mainHeight * 0.05 + shapeProps.height - ref.height())
                            newY = shapeProps.y + mainHeight * 0.05 + shapeProps.height - ref.height();
                        else
                            newY = pos.y;

                        return {
                            x: newX,
                            y: newY,
                        }
                    }}
                />

                <Text
                    fontFamily={shapeProps.result.fontFamily}
                    draggable
                    name={"object Result"}
                    listening
                    x={shapeProps.result.x}
                    y={shapeProps.result.y}
                    text={shapeProps.result.text}
                    fill={shapeProps.result.fill}
                    fontSize={shapeProps.result.fontSize}
                    ref={resultRef}

                    onDragEnd={(e) => {
                        if (e.target.name() === 'object Result') {
                            onChange({
                                ...shapeProps,
                                result: {
                                    x: e.target.x(),
                                    y: e.target.y(),
                                    text: shapeProps.result.text,
                                    fontSize: shapeProps.result.fontSize,
                                    fontFamily: shapeProps.result.fontFamily,
                                    fill: shapeProps.result.fill,
                                    answer: shapeProps.result.answer,
                                    visible: false,
                                },
                            });
                        }
                    }}

                    dragBoundFunc={(pos) => {
                        const ref = resultRef.current

                        let newX, newY;
                        if (pos.x < shapeProps.x + mainWidth * 0.1)
                            newX = shapeProps.x + mainWidth * 0.1;
                        else if (pos.x > shapeProps.x + mainWidth * 0.1 + shapeProps.width - ref.width())
                            newX = shapeProps.x + mainWidth * 0.1 + shapeProps.width - ref.width();
                        else
                            newX = pos.x;

                        if (pos.y < shapeProps.y + mainHeight * 0.05)
                            newY = shapeProps.y + mainHeight * 0.05;
                        else if (pos.y > shapeProps.y + mainHeight * 0.05 + shapeProps.height - ref.height())
                            newY = shapeProps.y + mainHeight * 0.05 + shapeProps.height - ref.height();
                        else
                            newY = pos.y;

                        return {
                            x: newX,
                            y: newY,
                        }
                    }}
                />
                <Group
                    name={"object Input"}
                    draggable
                    x={shapeProps.input.x}
                    y={shapeProps.input.y}
                    width={shapeProps.input.width}
                    height={shapeProps.input.height + 20}

                    onDragEnd={(e) => {
                        if (e.target.name() === 'object Input') {
                            onChange({
                                ...shapeProps,
                                input: {
                                    text: shapeProps.input.text,
                                    x: e.target.x(),
                                    y: e.target.y(),
                                    width: shapeProps.input.width,
                                    height: shapeProps.input.height,
                                    fontSize: shapeProps.input.fontSize,
                                    backgroundFill: shapeProps.input.backgroundFill,
                                    textFill: shapeProps.input.textFill,
                                    stroke: shapeProps.input.stroke,
                                    strokeWidth: shapeProps.input.strokeWidth,
                                    cornerRadius: shapeProps.input.cornerRadius,
                                    fontFamily: shapeProps.input.fontFamily,
                                    align: shapeProps.input.align,
                                    verticalAlign: shapeProps.input.verticalAlign
                                },
                            });
                        }
                    }}

                    dragBoundFunc={(pos) => {
                        const ref = inputRef.current

                        let newX, newY;
                        if (pos.x < shapeProps.x + mainWidth * 0.1)
                            newX = shapeProps.x + mainWidth * 0.1;
                        else if (pos.x > shapeProps.x + mainWidth * 0.1 + shapeProps.width - ref.width())
                            newX = shapeProps.x + mainWidth * 0.1 + shapeProps.width - ref.width();
                        else
                            newX = pos.x;

                        if (pos.y < shapeProps.y + mainHeight * 0.05)
                            newY = shapeProps.y + mainHeight * 0.05;
                        else if (pos.y > shapeProps.y + mainHeight * 0.05 + shapeProps.height - ref.height())
                            newY = shapeProps.y + mainHeight * 0.05 + shapeProps.height - ref.height();
                        else
                            newY = pos.y;

                        return {
                            x: newX,
                            y: newY,
                        }
                    }}
                >
                    <Rect
                        name={"object Input"}
                        width={shapeProps.input.width}
                        height={shapeProps.input.height}
                        fill={shapeProps.input.backgroundFill}
                        cornerRadius={shapeProps.input.cornerRadius}
                        strokeWidth={shapeProps.input.strokeWidth}
                        stroke={shapeProps.input.stroke}
                    />
                    <Text
                        align={shapeProps.input.align}
                        verticalAlign={shapeProps.input.verticalAlign}
                        fontFamily={shapeProps.input.fontFamily}
                        name={"object Answer"}
                        text={shapeProps.input.text}
                        height={shapeProps.input.height}
                        width={shapeProps.input.width}
                        fontSize={shapeProps.input.fontSize}
                        fill={shapeProps.input.textFill}
                        ref={inputRef}

                        onDblClick={() => {
                            const textNode = inputRef.current;
                            const stageRef = stageStore.stageRef;

                            // hide text node and transformer:
                            textNode.visible(false);
                            trRef.current.visible(false);

                            // create textarea over canvas with absolute position
                            // first we need to find position for textarea
                            // how to find it?

                            // at first lets find position of text node relative to the stage:
                            var textPosition = textNode.absolutePosition();

                            // so position of textarea will be the sum of positions above:
                            var areaPosition = {
                                x: stageRef.current.container().offsetLeft + textPosition.x,
                                y: stageRef.current.container().offsetTop + textPosition.y,
                            };

                            // create textarea and style it
                            var textarea = document.createElement('textarea');
                            document.body.appendChild(textarea);

                            // apply many styles to match text on canvas as close as possible
                            // remember that text rendering on canvas and on the textarea can be different
                            // and sometimes it is hard to make it 100% the same. But we will try...
                            textarea.value = textNode.text();
                            textarea.style.position = 'absolute';
                            textarea.style.top = areaPosition.y + 'px';
                            textarea.style.left = areaPosition.x + 'px';
                            textarea.style.width = textNode.width() - textNode.padding() * 2 + 'px';
                            textarea.style.height =
                                textNode.height() - textNode.padding() * 2 + 5 + 'px';
                            textarea.style.fontSize = textNode.fontSize() + 'px';
                            textarea.style.border = 'none';
                            textarea.style.padding = '0px';
                            textarea.style.margin = '0px';
                            textarea.style.overflow = 'hidden';
                            textarea.style.background = 'none';
                            textarea.style.outline = 'none';
                            textarea.style.resize = 'none';
                            textarea.style.lineHeight = textNode.lineHeight();
                            textarea.style.fontFamily = textNode.fontFamily();
                            textarea.style.transformOrigin = 'left top';
                            textarea.style.textAlign = textNode.align();
                            textarea.style.color = textNode.fill();
                            var rotation = textNode.rotation();
                            var transform = '';
                            if (rotation) {
                                transform += 'rotateZ(' + rotation + 'deg)';
                            }

                            var px = 0;
                            // also we need to slightly move textarea on firefox
                            // because it jumps a bit
                            var isFirefox =
                                navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
                            if (isFirefox) {
                                px += 2 + Math.round(textNode.fontSize() / 20);
                            }
                            transform += 'translateY(-' + px + 'px)';

                            textarea.style.transform = transform;

                            // reset height
                            textarea.style.height = 'auto';
                            // after browsers resized it we can set actual value
                            textarea.style.height = textarea.scrollHeight + 3 + 'px';

                            textarea.focus();

                            function removeTextarea() {
                                onChange({
                                    ...shapeProps,
                                    input: {
                                        text: textarea.value,
                                        x: shapeProps.input.x,
                                        y: shapeProps.input.y,
                                        width: shapeProps.input.width,
                                        height: shapeProps.input.height,
                                        fontSize: shapeProps.input.fontSize,
                                        backgroundFill: shapeProps.input.backgroundFill,
                                        textFill: shapeProps.input.textFill,
                                        stroke: shapeProps.input.stroke,
                                        strokeWidth: shapeProps.input.strokeWidth,
                                        cornerRadius: shapeProps.input.cornerRadius,
                                        fontFamily: shapeProps.input.fontFamily,
                                        align: shapeProps.input.align,
                                        verticalAlign: shapeProps.input.verticalAlign
                                    },
                                })
                                textarea.parentNode.removeChild(textarea);
                                window.removeEventListener('click', handleOutsideClick);
                                textNode.show();
                                trRef.current.show();
                                trRef.current.forceUpdate();
                            }

                            function setTextareaWidth(newWidth) {
                                if (!newWidth) {
                                    // set width for placeholder
                                    newWidth = textNode.placeholder.length * textNode.fontSize();
                                }
                                // some extra fixes on different browsers
                                var isSafari = /^((?!chrome|android).)*safari/i.test(
                                    navigator.userAgent
                                );
                                var isFirefox =
                                    navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
                                if (isSafari || isFirefox) {
                                    newWidth = Math.ceil(newWidth);
                                }

                                var isEdge =
                                    document.documentMode || /Edge/.test(navigator.userAgent);
                                if (isEdge) {
                                    newWidth += 1;
                                }
                                textarea.style.width = newWidth + 'px';
                            }

                            textarea.addEventListener('keydown', function (e) {
                                // hide on enter
                                // but don't hide on shift + enter
                                if (e.keyCode === 13 && !e.shiftKey) {
                                    textNode.text(textarea.value);
                                    removeTextarea();
                                }
                                // on esc do not set value back to node
                                if (e.keyCode === 27) {
                                    removeTextarea();
                                }
                            });

                            textarea.addEventListener('keydown', function (e) {
                                var scale = textNode.getAbsoluteScale().x;
                                setTextareaWidth(textNode.width() * scale);
                                textarea.style.height = 'auto';
                                textarea.style.height =
                                    textarea.scrollHeight + textNode.fontSize() + 'px';
                            });

                            function handleOutsideClick(e) {
                                if (e.target !== textarea) {
                                    textNode.text(textarea.value);
                                    removeTextarea();
                                }
                            }

                            setTimeout(() => {
                                window.addEventListener('click', handleOutsideClick);
                            });
                        }}
                    />
                </Group>
                <Group
                    name={"object Button"}
                    draggable
                    x={shapeProps.button.x}
                    y={shapeProps.button.y}
                    width={shapeProps.button.width}
                    height={shapeProps.button.height}
                    ref={buttonRef}

                    onDragEnd={(e) => {
                        if (e.target.name() === 'object Button') {
                            onChange({
                                ...shapeProps,
                                button: {
                                    x: e.target.x(),
                                    y: e.target.y(),
                                    width: shapeProps.button.width,
                                    height: shapeProps.button.height,
                                    fontSize: shapeProps.button.fontSize,
                                    backgroundFill: shapeProps.button.backgroundFill,
                                    textFill: shapeProps.button.textFill,
                                    text: shapeProps.button.text,
                                    cornerRadius: shapeProps.button.cornerRadius,
                                    fontFamily: shapeProps.button.fontFamily,
                                    align: shapeProps.button.align,
                                    verticalAlign: shapeProps.button.verticalAlign,
                                }
                            });
                        }
                    }}

                    dragBoundFunc={(pos) => {
                        const ref = buttonRef.current

                        let newX, newY;
                        if (pos.x < shapeProps.x + mainWidth * 0.1)
                            newX = shapeProps.x + mainWidth * 0.1;
                        else if (pos.x > shapeProps.x + mainWidth * 0.1 + shapeProps.width - ref.width())
                            newX = shapeProps.x + mainWidth * 0.1 + shapeProps.width - ref.width();
                        else
                            newX = pos.x;

                        if (pos.y < shapeProps.y + mainHeight * 0.05)
                            newY = shapeProps.y + mainHeight * 0.05;
                        else if (pos.y > shapeProps.y + mainHeight * 0.05 + shapeProps.height - ref.height())
                            newY = shapeProps.y + mainHeight * 0.05 + shapeProps.height - ref.height();
                        else
                            newY = pos.y;

                        return {
                            x: newX,
                            y: newY,
                        }
                    }}
                >
                    <Rect
                        name={"object Answer"}
                        width={shapeProps.button.width}
                        height={shapeProps.button.height}
                        fill={shapeProps.button.backgroundFill}
                        cornerRadius={shapeProps.button.cornerRadius}
                    />
                    <Text
                        align={shapeProps.button.align}
                        verticalAlign={shapeProps.button.verticalAlign}
                        fontFamily={shapeProps.button.fontFamily}
                        name={"object Answer"}
                        text={shapeProps.button.text}
                        height={shapeProps.button.height}
                        width={shapeProps.button.width}
                        fontSize={shapeProps.button.fontSize}
                        fill={shapeProps.button.textFill}
                    />
                </Group>
            </Group>
            {isSelected && (
                <Transformer
                    ref={trRef}
                />
            )}
        </React.Fragment>
    );
}

export default FlashcardsElementEditor;