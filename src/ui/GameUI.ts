import { GameState } from '../game/GameState.ts';

export class GameUI {
  // Header Elements
  private headerGoalBadge: HTMLElement;
  private headerGoalIcon: HTMLElement;
  private headerGoalText: HTMLElement;
  private staminaBarFill: HTMLElement;
  private healthBarFill: HTMLElement;
  private heartsContainer: HTMLElement;
  private timerDisplay: HTMLElement;

  // Intro Splash Elements (5-Second Timer)
  private introSplash: HTMLElement;
  private introTimerText: HTMLElement;
  private introTimerBar: HTMLElement;
  private introStartBtn: HTMLButtonElement | null = null;
  private introRemainingSeconds: number = 5.0;
  public isIntroActive: boolean = true;

  // Modals & Prompts
  private modalContainer: HTMLElement;
  private modalTitle: HTMLElement;
  private modalBody: HTMLElement;
  private modalButton: HTMLButtonElement;
  private damageFlashOverlay: HTMLElement;
  private pickupPrompt: HTMLElement;

  public onRestartClick?: () => void;
  public onPickupClick?: () => void;
  public onDifficultyChange?: (mode: string) => void;
  public onIntroComplete?: () => void;

  constructor() {
    this.headerGoalBadge = document.getElementById('headerGoalBadge')!;
    this.headerGoalIcon = document.getElementById('headerGoalIcon')!;
    this.headerGoalText = document.getElementById('headerGoalText')!;
    this.staminaBarFill = document.getElementById('staminaFill')!;
    this.healthBarFill = document.getElementById('healthFill')!;
    this.heartsContainer = document.getElementById('heartsDisplay')!;
    this.timerDisplay = document.getElementById('timerText')!;

    this.introSplash = document.getElementById('introGoalSplash')!;
    this.introTimerText = document.getElementById('introTimerText')!;
    this.introTimerBar = document.getElementById('introTimerBar')!;
    this.introStartBtn = document.getElementById('introStartBtn') as HTMLButtonElement;

    if (this.introStartBtn) {
      this.introStartBtn.addEventListener('click', () => {
        this.dismissIntro();
      });
    }

    this.modalContainer = document.getElementById('gameModal')!;
    this.modalTitle = document.getElementById('modalTitle')!;
    this.modalBody = document.getElementById('modalBody')!;
    this.modalButton = document.getElementById('modalBtn') as HTMLButtonElement;
    this.damageFlashOverlay = document.getElementById('damageFlash')!;
    this.pickupPrompt = document.getElementById('pickupPrompt')!;

    // Difficulty buttons
    const diffButtons = document.querySelectorAll<HTMLButtonElement>('.diff-btn');
    diffButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        diffButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode') || 'MEDIUM';
        if (this.onDifficultyChange) this.onDifficultyChange(mode);
      });
    });

    if (this.modalButton) {
      this.modalButton.addEventListener('click', () => {
        this.hideModal();
        if (this.onRestartClick) this.onRestartClick();
      });
    }

    if (this.pickupPrompt) {
      this.pickupPrompt.addEventListener('click', () => {
        if (this.onPickupClick) this.onPickupClick();
      });
    }
  }

  public triggerDamageFlash(): void {
    if (this.damageFlashOverlay) {
      this.damageFlashOverlay.classList.remove('flash-active');
      void this.damageFlashOverlay.offsetWidth;
      this.damageFlashOverlay.classList.add('flash-active');
    }
  }

  public setPickupPromptVisible(visible: boolean): void {
    if (this.pickupPrompt) {
      if (visible) {
        this.pickupPrompt.classList.remove('hidden');
      } else {
        this.pickupPrompt.classList.add('hidden');
      }
    }
  }

  public dismissIntro(): void {
    if (!this.isIntroActive || !this.introSplash) return;
    this.isIntroActive = false;
    this.introSplash.classList.add('fade-out');
    setTimeout(() => {
      if (this.introSplash) this.introSplash.style.display = 'none';
    }, 500);

    if (this.onIntroComplete) {
      this.onIntroComplete();
    }
  }

  public updateIntroSplash(deltaSeconds: number): void {
    if (!this.isIntroActive || !this.introSplash) return;

    this.introRemainingSeconds -= deltaSeconds;

    if (this.introRemainingSeconds > 0) {
      const displaySecs = Math.ceil(this.introRemainingSeconds);
      if (this.introTimerText) {
        this.introTimerText.textContent = `${displaySecs}s`;
      }
      if (this.introTimerBar) {
        const pct = Math.max(0, (this.introRemainingSeconds / 5.0) * 100);
        this.introTimerBar.style.width = `${pct}%`;
      }
    } else {
      this.dismissIntro();
    }
  }

  public resetIntroSplash(): void {
    this.introRemainingSeconds = 5.0;
    this.isIntroActive = true;
    if (this.introSplash) {
      this.introSplash.style.display = 'flex';
      this.introSplash.classList.remove('fade-out');
    }
    if (this.introTimerText) {
      this.introTimerText.textContent = '5s';
    }
    if (this.introTimerBar) {
      this.introTimerBar.style.width = '100%';
    }
  }

  public updateHUD(
    state: GameState,
    health: number,
    maxHealth: number,
    stamina: number,
    maxStamina: number,
    timeSeconds: number,
    isPlayerInOuterZone: boolean,
    isPlayerInInnerZone: boolean,
    isPlayerStationary: boolean,
    canPickupBanana: boolean,
    distToEscape?: number,
    isPortalAppeared?: boolean
  ): void {
    // 1. Update Pickup Prompt
    this.setPickupPromptVisible(canPickupBanana && state === GameState.PLAYING);

    // 2. Update Health Bar & Hearts
    const healthPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    if (this.healthBarFill) {
      this.healthBarFill.style.width = `${healthPct}%`;
      if (healthPct > 60) {
        this.healthBarFill.style.background = 'linear-gradient(90deg, #4ade80, #22c55e)';
      } else if (healthPct > 30) {
        this.healthBarFill.style.background = 'linear-gradient(90deg, #facc15, #eab308)';
      } else {
        this.healthBarFill.style.background = 'linear-gradient(90deg, #f87171, #ef4444)';
      }
    }

    if (this.heartsContainer) {
      const hearts = health >= 67 ? '❤️❤️❤️' : health >= 34 ? '❤️❤️🖤' : health > 0 ? '❤️🖤🖤' : '🖤🖤🖤';
      this.heartsContainer.textContent = hearts;
    }

    // 3. Update Stamina
    const staminaPct = Math.max(0, Math.min(100, (stamina / maxStamina) * 100));
    if (this.staminaBarFill) {
      this.staminaBarFill.style.width = `${staminaPct}%`;
    }

    // 4. Update Timer
    const mins = Math.floor(timeSeconds / 60);
    const secs = Math.floor(timeSeconds % 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    if (this.timerDisplay) {
      this.timerDisplay.textContent = timeStr;
    }

    // 5. Update Header Goal Badge (Non-blocking, top bar)
    if (this.headerGoalBadge && this.headerGoalText) {
      if (state === GameState.BANANA_HELD) {
        const distStr = distToEscape !== undefined ? ` (${Math.round(distToEscape)}m)` : '';
        if (isPortalAppeared) {
          this.headerGoalIcon.textContent = '🟢';
          this.headerGoalText.textContent = `SAFE HOME OPEN! ENTER PORTAL!${distStr}`;
          this.headerGoalBadge.className = 'header-goal-badge pulse-gold';
        } else {
          this.headerGoalIcon.textContent = '🐟';
          this.headerGoalText.textContent = `DODGE SKY FISH! Safe home reappearing in 2s...${distStr}`;
          this.headerGoalBadge.className = 'header-goal-badge pulse-red';
        }
      } else if (canPickupBanana) {
        this.headerGoalIcon.textContent = '🍌';
        this.headerGoalText.textContent = 'Press [E] to Snatch Banana!';
        this.headerGoalBadge.className = 'header-goal-badge pulse-gold';
      } else if (isPlayerInInnerZone) {
        this.headerGoalIcon.textContent = '🚨';
        this.headerGoalText.textContent = isPlayerStationary ? 'DON’T STOP! Defenders striking!' : 'Inner Zone: Monkey Defenders Attacking!';
        this.headerGoalBadge.className = isPlayerStationary ? 'header-goal-badge pulse-red' : 'header-goal-badge pulse-orange';
      } else if (isPlayerInOuterZone) {
        this.headerGoalIcon.textContent = '🐟';
        this.headerGoalText.textContent = 'Outer Zone: Spectators Throwing Fish! Dodge!';
        this.headerGoalBadge.className = 'header-goal-badge pulse-blue';
      } else {
        this.headerGoalIcon.textContent = '🎯';
        this.headerGoalText.textContent = 'Reach Pedestal & Snatch Banana';
        this.headerGoalBadge.className = 'header-goal-badge pulse-yellow';
      }
    }
  }

  public showVictory(timeSeconds: number): void {
    const mins = Math.floor(timeSeconds / 60);
    const secs = Math.floor(timeSeconds % 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    this.modalTitle.innerHTML = `🏆 YOU ESCAPED!`;
    this.modalTitle.style.color = '#4ade80';
    this.modalBody.innerHTML = `
      <p class="modal-msg">You dodged the falling fish plunging into splashing water ponds, outran the rival monkeys, and caught the moving green extraction zone with the golden banana!</p>
      <div class="stat-row">
        <span>⏱️ Escape Time:</span>
        <strong>${timeStr}</strong>
      </div>
      <div class="stat-row">
        <span>🍌 Title:</span>
        <strong>Ultimate Banana Legend 🏆</strong>
      </div>
    `;
    this.modalButton.textContent = 'PLAY AGAIN 🍌';
    this.modalContainer.classList.remove('hidden');
    this.setPickupPromptVisible(false);
  }

  public showDefeat(timeSeconds: number): void {
    const mins = Math.floor(timeSeconds / 60);
    const secs = Math.floor(timeSeconds % 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    this.modalTitle.innerHTML = `💀 KNOCKED OUT!`;
    this.modalTitle.style.color = '#f87171';
    this.modalBody.innerHTML = `
      <p class="modal-msg">The defenders caught you standing still and drained your lifeline!</p>
      <div class="stat-row">
        <span>⏱️ Survived:</span>
        <strong>${timeStr}</strong>
      </div>
    `;
    this.modalButton.textContent = 'TRY AGAIN 🍌';
    this.modalContainer.classList.remove('hidden');
    this.setPickupPromptVisible(false);
  }

  public hideModal(): void {
    this.modalContainer.classList.add('hidden');
  }
}
