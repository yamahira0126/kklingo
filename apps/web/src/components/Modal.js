// モーダル（メッセージとか出す）
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Button from "./Button";

export default function Modal({ title, message, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black bg-black/40 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="text-lg font-bold mb-4">{title}</h2>
          <p className="mb-4">{message}</p>
         <Button
            label="閉じる"
            onClick={onClose}
            className="bg-[#59d5d7] text-white hover:bg-[#48c4c5]"
        />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

