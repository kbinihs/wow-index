import { useState } from 'preact/hooks';
import { NAMES, pickText, PROFILES } from '../../data/profiles';
import type { Slot } from '../../scoring';
import type { Archetype } from '../../types';
import { Crest } from '../Crest';

/** 1·2위가 A 평균과 B 횟수로도 갈리지 않을 때 본인이 고른다 */
export function Pick({
  slot,
  candidates,
  initial,
  onConfirm,
  onBack,
}: {
  slot: Slot;
  candidates: Archetype[];
  initial?: Archetype;
  onConfirm: (a: Archetype) => void;
  onBack: () => void;
}) {
  const [chosen, setChosen] = useState<Archetype | null>(initial && candidates.includes(initial) ? initial : null);
  return (
    <>
      <p class="guide">{pickText(candidates)}</p>
      <fieldset class="question">
        <legend class="sr-only">{slot === 'core' ? '주 유형' : '보조 유형'}</legend>
        <div class="options">
          {candidates.map((a) => (
            <label class="option" key={a}>
              <input type="radio" name={`pick-${slot}`} value={a} checked={chosen === a} onChange={() => setChosen(a)} />
              <span class="option-face option-crest">
                <Crest archetype={a} size={44} />
                <span>
                  <strong>{NAMES[a]}</strong>
                  <span class="option-detail">{PROFILES[a].oneLine}</span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div class="dock">
        <nav class="step-nav" aria-label="단계 이동">
          <button type="button" class="btn btn-secondary" onClick={onBack}>
            이전
          </button>
          <button type="button" class="btn btn-primary" disabled={!chosen} onClick={() => chosen && onConfirm(chosen)}>
            확인
          </button>
        </nav>
      </div>
    </>
  );
}
