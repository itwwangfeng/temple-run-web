import type { InputState } from "./types";

export class InputManager {
  state: InputState = {
    left: false,
    right: false,
    jump: false,
    slide: false
  };

  private jumpQueued = false;
  private slideQueued = false;

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  consumeActions() {
    const jump = this.jumpQueued;
    const slide = this.slideQueued;
    this.jumpQueued = false;
    this.slideQueued = false;
    return { jump, slide };
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) return;
    switch (event.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        this.state.left = true;
        break;
      case "ArrowRight":
      case "d":
      case "D":
        this.state.right = true;
        break;
      case " ":
        this.state.jump = true;
        this.jumpQueued = true;
        break;
      case "s":
      case "S":
        this.state.slide = true;
        this.slideQueued = true;
        break;
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        this.state.left = false;
        break;
      case "ArrowRight":
      case "d":
      case "D":
        this.state.right = false;
        break;
      case " ":
        this.state.jump = false;
        break;
      case "s":
      case "S":
        this.state.slide = false;
        break;
    }
  };
}
