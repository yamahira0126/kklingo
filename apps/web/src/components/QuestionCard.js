// 問題表示用のカード

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import Button from './Button';

export default function QuestionCard({ title="問題", question, hint, answer }) {
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <motion.div
      className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl text-left"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => (
              <p className="whitespace-pre-wrap mb-2" {...props} />
            ),
          }}
        >
          {question}
        </ReactMarkdown>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          label={showHint ? "ヒントを隠す" : "ヒントを見る"}
          onClick={() => setShowHint(!showHint)}
          className="bg-yellow-200 text-[#4b3d2a] hover:bg-yellow-300"
        />

        {showHint && (
          <motion.div
            className="bg-[#ffffe5] p-3 rounded-md text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => (
                <p className="whitespace-pre-wrap mb-2" {...props} />
              ),
            }}
          >
            {hint}
          </ReactMarkdown>
          </motion.div>
        )}

        <Button
          label={showAnswer ? "答えを隠す" : "答えを見る"}
          onClick={() => setShowAnswer(!showAnswer)}
          className="bg-[#59d5d7] text-white hover:bg-[#48c4c5]"
        />

        {showAnswer && (
          <motion.div
            className="bg-green-50 p-3 rounded-md text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => (
                <p className="whitespace-pre-wrap mb-2" {...props} />
              ),
            }}
          >
            {answer}
          </ReactMarkdown>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
