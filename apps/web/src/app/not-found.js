'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-gray-800 text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <Image
          src="/kklingo_character2.PNG"
          alt="泣いているキャラクター"
          width={150}
          height={150}
          priority
        />
      </motion.div>

      <motion.h1
        className="text-6xl font-bold mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        404 Not Found
      </motion.h1>

      <motion.p
        className="text-xl mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        お探しのページは見つかりませんでした🤣
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Link
          href="/"
          className="px-6 py-3 bg-[#59d5d7] text-white rounded-full hover:bg-[#48c4c5] transition"
        >
          ホームに戻る
        </Link>
      </motion.div>
    </div>
  );
}
