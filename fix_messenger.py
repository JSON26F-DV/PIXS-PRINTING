import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # MessageList.tsx specific replacements
    if 'MessageList.tsx' in filepath:
        # 1. Imports
        content = re.sub(r"import \{ m, AnimatePresence, MotionConfig \} from 'framer-motion'\n", "", content)
        content = re.sub(r"import LazyCard from './LazyCard'\n", "", content)

        # 2. LazyCard removal
        content = re.sub(r"<LazyCard approxHeight=\{[0-9]+\}>\s*", "", content)
        content = re.sub(r"\s*</LazyCard>", "", content)

        # 3. AnimatePresence removal
        content = re.sub(r"<AnimatePresence[^>]*>\s*", "", content)
        content = re.sub(r"\s*</AnimatePresence>", "", content)

        # 4. m.div -> div
        content = re.sub(r"<m\.div[^>]*initial=\{[^}]+\}\s*animate=\{[^}]+\}\s*exit=\{[^}]+\}", "<div", content)
        content = re.sub(r"</m\.div>", "</div>", content)
        
        # Also any other m.div just in case
        content = re.sub(r"<m\.div", "<div", content)

        # 5. MotionConfig wrapper
        content = re.sub(r'<MotionConfig transition=\{\{ duration: 0 \}\} reducedMotion="always">\s*', "", content)
        content = re.sub(r'\s*</MotionConfig>', "", content)

        # 6. React.memo on MessageBubble
        content = re.sub(r"const MessageBubble = React\.memo<\{", "const MessageBubble: React.FC<{", content)
        content = re.sub(r"\}\>\(\(\{", "}> = ({", content)
        content = re.sub(r"\s*\}\)\n\nMessageBubble\.displayName = 'MessageBubble'\n", "\n}\n", content)

        # 7. Virtuoso config
        virtuoso_old = r"<Virtuoso\s+ref=\{virtuosoRef\}\s+customScrollParent=\{scrollContainer \|\| undefined\}\s+data=\{messages\}\s+useWindowScroll=\{false\}\s+overscan=\{2\}"
        virtuoso_new = """<Virtuoso
              ref={virtuosoRef}
              customScrollParent={scrollContainer || undefined}
              data={messages}
              increaseViewportBy={{ top: 800, bottom: 800 }}
              useWindowScroll={true}
              overscan={5}
              style={{ overflowY: 'auto' }}
              defaultItemHeight={150}"""
        content = re.sub(virtuoso_old, virtuoso_new, content)

    # All message components
    elif 'ConfirmMessage.tsx' in filepath or 'RefundMessage.tsx' in filepath or 'EmailMessage.tsx' in filepath:
        # Remove React.memo
        content = re.sub(r"const ([a-zA-Z]+): React\.FC<[^>]+> = React\.memo\(\(\{ ([^\}]+) \}\) => \{", r"export default function \1({ \2 }: \1Props) {", content)
        
        # Remove the bottom export default and displayName
        content = re.sub(r"\}\)\n\n[a-zA-Z]+\.displayName = '[a-zA-Z]+'\nexport default [a-zA-Z]+\n", "}\n", content)

    # FullscreenGalleryModal.tsx
    elif 'FullscreenGalleryModal.tsx' in filepath:
        content = re.sub(r"import \{ m, AnimatePresence, useReducedMotion \} from 'framer-motion'\n", "", content)
        content = re.sub(r"const shouldReduceMotion = useReducedMotion\(\)\n", "", content)
        content = re.sub(r"<AnimatePresence(?: mode=\"wait\")?>", "", content)
        content = re.sub(r"</AnimatePresence>", "", content)
        content = re.sub(r"<m\.div[^>]*>", "<div className=\"relative flex h-full w-full items-center justify-center\">", content)
        content = re.sub(r"</m\.div>", "</div>", content)
        content = re.sub(r"<m\.button[^>]*onClick=\{handlePrev\}[^>]*>", """<button
                onClick={handlePrev}
                className="hover:bg-pixs-mint group absolute left-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/5 bg-black/40 text-white shadow-2xl backdrop-blur-md transition-all hover:text-slate-900 active:scale-95 md:left-12"
              >""", content)
        content = re.sub(r"<m\.button[^>]*onClick=\{handleNext\}[^>]*>", """<button
                onClick={handleNext}
                className="hover:bg-pixs-mint group absolute right-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/5 bg-black/40 text-white shadow-2xl backdrop-blur-md transition-all hover:text-slate-900 active:scale-95 md:right-12"
              >""", content)
        content = re.sub(r"</m\.button>", "</button>", content)
        # remove the complex m.div attributes
        # Since I blindly replaced <m.div...> it might leave dangling attributes if they were multiline.
        # Let's write a better replacement for m.div
        pass

    with open(filepath, 'w') as f:
        f.write(content)

process_file('/home/jason/Documents/PIXS-PRINTING/frontend/src/pages/Messenger/components/MessageList.tsx')
process_file('/home/jason/Documents/PIXS-PRINTING/frontend/src/pages/Messenger/components/OrderConfirmMessage.tsx')
process_file('/home/jason/Documents/PIXS-PRINTING/frontend/src/pages/Messenger/components/ScreenplateConfirmMessage.tsx')
process_file('/home/jason/Documents/PIXS-PRINTING/frontend/src/pages/Messenger/components/RefundMessage.tsx')
process_file('/home/jason/Documents/PIXS-PRINTING/frontend/src/pages/Messenger/components/ExpenditureConfirmMessage.tsx')
# process_file('/home/jason/Documents/PIXS-PRINTING/frontend/src/pages/Messenger/components/EmailMessage.tsx')

