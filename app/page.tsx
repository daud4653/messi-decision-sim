import Link from "next/link";
import { Icon } from "@/components/Icon";
import { StickerAsset } from "@/components/stickers/StickerAsset";
import { coverage } from "@/lib/simulator/repository";
export const dynamic = "force-dynamic";
export default async function Home() {
  const data = await coverage();
  return (
    <main className="home">
      <div className="eyebrow">
        <span>THE BEAUTIFUL GAME. ONE DECISION AT A TIME.</span>
        <span>VOL. 01 / THE MESSI EXPERIMENT</span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker">CAN YOU THINK LIKE MESSI?</p>
          <h1>
            FIVE SECONDS.
            <br />
            ONE <em>LEFT FOOT.</em>
            <br />
            YOUR CALL.
          </h1>
          <p className="hero-description">
            Step into the moment before the magic.
            <br />
            You decide. The AI decides.
            <br />
            Then see what Messi did.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/play">
              START SIMULATION <Icon name="arrow" />
            </Link>
            <Link className="text-link" href="/methodology">
              HOW IT WORKS
            </Link>
          </div>
        </div>
        <div className="hero-art">
          <span className="art-caption">
            THE WORLD SAW THE RESULT.
            <br />
            YOU GET THE MOMENT BEFORE.
          </span>
          <StickerAsset name="barcelona2019" large />
          <div className="art-number">
            ROSARIO, ARGENTINA
            <br />
            EST. 1987
          </div>
          <span className="art-tag">El Diez.</span>
        </div>
      </section>
      <section className="home-bottom" aria-label="How to play">
        <div>
          <span className="step-number">01</span>
          <h2>READ THE GAME</h2>
          <p>The clock. The score. The space.</p>
        </div>
        <div>
          <span className="step-number">02</span>
          <h2>TRUST YOUR INSTINCT</h2>
          <p>Six actions. One locked decision.</p>
        </div>
        <div>
          <span className="step-number">03</span>
          <h2>MEET THE REAL ANSWER</h2>
          <p>Compare the choices. Play the next moment.</p>
        </div>
      </section>
      <div className="coverage-strip">
        <strong>
          {data.fixture ? "TRAINING EDITION" : "DATASET COVERAGE"}
        </strong>
        <span>
          {data.scenarios}{" "}
          {data.fixture
            ? "illustrative scenarios · not historical records"
            : `recorded moments · ${data.matches} matches`}
        </span>
        <Link href="/methodology">ABOUT THE DATA</Link>
      </div>
    </main>
  );
}
