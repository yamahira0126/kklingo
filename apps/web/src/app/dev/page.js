// test
// ★最後に削除する
'use client';

import Card from "@/components/Card";
import Button from "@/components/Button";
import { useState } from "react";
import Modal from "@/components/Modal";
import QuestionCard from "@/components/QuestionCard";
import LoadingSpinner from '@/components/LoadingSpinner';


export default function TestPage() {
  // モーダルを開くか閉じるかのセット
  const [showModal, setShowModal] = useState(false);

  // ローディングスピナーのON・OFF
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <main className="text-center py-20">
        <h2 className="text-4xl font-bold mb-4 text-[#59d5d7]">開発用 テストページ</h2>
        <div className="flex flex-col items-center space-y-4 mt-8">
        </div> 

        <div className="p-8 grid gap-6">
          <Card
            title="カード"
            description="ここに説明とか書ける"
          >
          <Button
            label="ボタン"
            onClick={() => alert("ボタンを押した")}
            className="bg-[#00cc33] text-white hover:bg-[#48c4c5]"
            />
          </Card>
        </div>

        <div className="p-6">
          <Button
            label="モーダルを開く"
            onClick={() => setShowModal(true)}
            className="bg-[#59d5d7] text-white hover:bg-[#48c4c5]"
          />

          {showModal && (
            <Modal
              title="モーダル"
              message="これがモーダルです"
              onClose={() => setShowModal(false)}
            />
          )}
        </div>

        <div className="p-6">
          <QuestionCard
            title="Question"
            question="任意の自然数からスタートして、奇数は3をかけて1を加える。偶数は2で割る。この計算を繰り返すと必ず1になることを証明しなさい。"
            hint="解けたら**1億2000万円もらえるらしい**"
            answer="これは**未解決問題**です"
        />
        </div>

        <div className="p-6">
          <Button
            label={isLoading ? <p>クルクルを停止する</p> : <p>読み込み中のクルクル</p>}
            onClick={() => setIsLoading(!isLoading)}
            className="bg-[#59d5d7] text-white hover:bg-[#48c4c5]"
          />
          {isLoading ? <p>回転中</p> : <p>停止中</p>}
          {isLoading ? <LoadingSpinner /> : <p></p>}
        </div>
      </main>
    </div>
  );
}

