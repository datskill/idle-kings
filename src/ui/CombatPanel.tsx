import {
  AREAS, availableEnemies, canEquip, combatLevel, ENEMIES_BY_ID, enemyHitChance, equip, FOOD, GEAR, GEAR_BY_ITEM, maxHp,
  nextEnemy, playerHitChance, playerMaxHit, PLAYER_SPEED_MS, SLOTS, startCombat, stopCombat, unequip, type CombatStyle,
} from '../game/combat'
import { ITEMS, SKILLS, type ItemId, type SkillId } from '../game/data'
import { skillLevel } from '../game/engine'
import type { GameState } from '../game/state'
import { game } from '../game/store'
import { levelProgress } from '../game/xp'
import { fmt } from './format'

const pct = (x: number) => `${Math.round(x * 100)} %`
const COMBAT_SKILLS: SkillId[] = ['weapons', 'defence', 'endurance']
const STYLES: { id: CombatStyle; label: string }[] = [
  { id: 'weapons', label: "🗡️ Attaque (XP en maniement d'armes)" },
  { id: 'defence', label: '🛡️ Garde (XP en défense)' },
]

function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div className="bar">
      <div className={`bar-fill ${className ?? ''}`} style={{ width: `${Math.max(0, Math.min(1, value / max)) * 100}%` }} />
    </div>
  )
}

export function CombatPanel({ state }: { state: GameState }) {
  const fight = state.combat
  const enemy = fight ? ENEMIES_BY_ID[fight.enemyId] : null
  const hpMax = maxHp(state)
  const foods = (Object.keys(FOOD) as ItemId[]).filter((f) => (state.bank[f] ?? 0) > 0 || state.food === f)
  const spareGear = GEAR.filter((g) => (state.bank[g.item] ?? 0) > 0)
  // Enemies stay hidden until the player meets their level requirements.
  const enemies = availableEnemies(state)
  const upcoming = nextEnemy(state)

  return (
    <section>
      <header className="panel-header">
        <h2>⚔️ Combat</h2>
        <div className="xp-line">
          Niveau de combat <strong>{combatLevel(state)}</strong> · dégâts max {playerMaxHit(state)}
        </div>
        <div className="combat-skills">
          {COMBAT_SKILLS.map((sk) => (
            <div key={sk} className="combat-skill">
              <span>
                {SKILLS[sk].icon} {SKILLS[sk].name} <strong>{skillLevel(state, sk)}</strong>
              </span>
              <Bar value={levelProgress(state.skills[sk].xp)} max={1} className="xp" />
            </div>
          ))}
        </div>
      </header>

      {game.notice && (
        <div className="notice" onClick={() => game.dismissNotice()}>
          {game.notice} <span className="muted">(cliquer pour fermer)</span>
        </div>
      )}

      <div className="combat-grid">
        <div className="settings-block">
          <h3>Toi</h3>
          <div className="hp-line">
            ❤️ {Math.ceil(state.hp)} / {hpMax} PV
          </div>
          <Bar value={state.hp} max={hpMax} className="hp" />
          {fight && <Bar value={PLAYER_SPEED_MS - fight.playerTimer} max={PLAYER_SPEED_MS} />}

          <div className="recipe-label spaced">Posture</div>
          <div className="style-picker">
            {STYLES.map((st) => (
              <label key={st.id}>
                <input
                  type="radio"
                  name="style"
                  checked={state.combatStyle === st.id}
                  onChange={() => game.update((s) => void (s.combatStyle = st.id))}
                />{' '}
                {st.label}
              </label>
            ))}
          </div>

          <div className="recipe-label spaced">Nourriture (mangée sous 50 % de PV)</div>
          <select
            value={state.food ?? ''}
            onChange={(e) => game.update((s) => void (s.food = (e.target.value || null) as ItemId | null))}
          >
            <option value="">Aucune</option>
            {foods.map((f) => (
              <option key={f} value={f}>
                {ITEMS[f].name} (+{FOOD[f]} PV) × {fmt(state.bank[f] ?? 0)}
              </option>
            ))}
          </select>
          {foods.length === 0 && <p className="muted small">Cuisine du poisson pour pouvoir te soigner.</p>}

          <div className="recipe-label spaced">Équipement</div>
          <table className="gear">
            <tbody>
              {SLOTS.map((slot) => {
                const item = state.equipment[slot.id]
                const g = item ? GEAR_BY_ITEM[item] : null
                return (
                  <tr key={slot.id}>
                    <td className="muted">{slot.name}</td>
                    <td>
                      {item ? ITEMS[item].name : <span className="muted">—</span>}
                      {g && (
                        <span className="muted small">
                          {' '}
                          {g.attack ? `att +${g.attack} ` : ''}
                          {g.strength ? `force +${g.strength} ` : ''}
                          {g.defence ? `déf +${g.defence}` : ''}
                        </span>
                      )}
                    </td>
                    <td>{item && <button onClick={() => game.update((s) => unequip(s, slot.id))}>Retirer</button>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {spareGear.length > 0 && (
            <>
              <div className="recipe-label spaced">En réserve</div>
              {spareGear.map((g) => (
                <div key={g.item} className="spare-gear">
                  <span>
                    {ITEMS[g.item].name} <span className="muted small">(niv. {g.levelRequired})</span>
                  </span>
                  <button disabled={!canEquip(state, g.item)} onClick={() => game.update((s) => void equip(s, g.item))}>
                    Équiper
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        <div>
          {fight && enemy ? (
            <div className="settings-block fight">
              <h3>Combat contre : {enemy.name}</h3>
              <div className="hp-line">
                {Math.max(0, fight.enemyHp)} / {enemy.hp} PV
              </div>
              <Bar value={fight.enemyHp} max={enemy.hp} className="hp" />
              <Bar value={enemy.speedMs - fight.enemyTimer} max={enemy.speedMs} />
              <p className="muted small">
                Tu touches {pct(playerHitChance(state, enemy))} du temps, il te touche {pct(enemyHitChance(state, enemy))} (jusqu'à{' '}
                {enemy.maxHit} dégâts).
              </p>
              <button onClick={() => game.update(stopCombat)}>Fuir</button>
            </div>
          ) : (
            <p className="muted">Choisis un adversaire. Le combat continue tant que tu ne fuis pas, même hors ligne.</p>
          )}

          {upcoming && (
            <div className="next-unlock block">
              Prochain adversaire : maniement d'armes {upcoming.requires.weapons}, défense {upcoming.requires.defence}, endurance{' '}
              {upcoming.requires.endurance}.
            </div>
          )}
          {AREAS.filter((area) => enemies.some((e) => e.area === area)).map((area) => (
            <div key={area} className="action-group">
              <h3 className="group-title">{area}</h3>
              <div className="cards">
                {enemies.filter((e) => e.area === area).map((e) => {
                  const current = fight?.enemyId === e.id
                  return (
                    <button
                      key={e.id}
                      className={`card ${current ? 'running' : ''}`}
                      onClick={() => game.update((s) => void (current ? stopCombat(s) : startCombat(s, e.id)))}
                    >
                      <div className="card-title">{e.name}</div>
                      <div className="card-meta">
                        {e.hp} PV · dégâts max {e.maxHit}
                        <br />
                        Tu touches : {pct(playerHitChance(state, e))}
                        <br />
                        Il touche : {pct(enemyHitChance(state, e))}
                        <br />
                        Butin : {e.gold[0]} à {e.gold[1]} écus{e.loot.length > 0 && ', objets'}
                      </div>
                      <div className="card-action">{current ? 'Fuir' : 'Combattre'}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
