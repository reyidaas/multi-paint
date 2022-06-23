import Position from '../../../models/Position';
import type CanvasSettings from '../types/CanvasSettings';
import CanvasState, { SetStateFn } from '../types/CanvasState';
import type { MessageHandler } from '../../../types/Message';
import { MessageEvent } from '../../../types/Event';

export default class CanvasManager {
  private state: CanvasState = {
    isDragging: false,
    cursorPosition: new Position(0, 0),
    scale: 1,
    translate: new Position(0, 0),
    users: {},
  };
  private readonly ctx: CanvasRenderingContext2D;
  private drawHandle = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly messageHandler: MessageHandler,
    private readonly settings: CanvasSettings,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not initialize canvas context.');
    }

    this.ctx = ctx;
  }

  private drawBackground(): void {
    const {
      ctx,
      settings: { bgColor },
      canvas,
    } = this;

    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // Mock object for now
  private drawObjects(): void {
    const { ctx } = this;

    ctx.fillStyle = '#000000';
    ctx.fillRect(200, 200, 50, 50);
  }

  private drawCursors(): void {
    const { ctx } = this;

    Object.values(this.state.users).forEach(
      ({
        cursor: {
          color,
          position: { x, y },
        },
        username,
      }) => {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 15, y + 5);
        ctx.lineTo(x + 5, y + 15);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = this.settings.textColor;
        const { width } = ctx.measureText(username);
        ctx.strokeText(username, x - width / 2, y - 5);
      },
    );
  }

  calculateCanvasCursorPosition(x: number, y: number): Position {
    const { canvas } = this;
    return new Position(
      x - canvas.offsetLeft,
      y - canvas.offsetTop,
    );
  }

  draw(): void {
    this.drawBackground();
    this.drawObjects();
    this.drawCursors();
    this.drawHandle = requestAnimationFrame(this.draw.bind(this));
  }

  stopDraw(): void {
    if (this.drawHandle) {
      cancelAnimationFrame(this.drawHandle);
    }
  }

  private handleZoom(e: WheelEvent): void {
    e.preventDefault();

    const {
      settings: { scaleFactor, maxZoom, minZoom },
      state,
      ctx,
    } = this;
    const wheel = e.deltaY < 0 ? 1 : -1;
    const zoom = Math.exp(wheel * scaleFactor);

    if (
      (zoom > 1 && state.scale < maxZoom) ||
      (zoom < 1 && state.scale > minZoom)
    ) {
      const { x, y } = this.calculateCanvasCursorPosition(e.clientX, e.clientY);

      const tr = ctx.getTransform();

      tr.translateSelf(state.translate.x, state.translate.y);
      tr.scaleSelf(zoom, zoom);

      this.setState(
        'translate',
        (prev) =>
          new Position(
            prev.x - (x / (state.scale * zoom) - x / state.scale),
            prev.y - (y / (state.scale * zoom) - y / state.scale),
          ),
      );

      tr.translateSelf(-state.translate.x, -state.translate.y);
      ctx.setTransform(tr);

      this.setState('scale', (prev) => prev * zoom);
    }
  }

  private handleMoveStart(e: MouseEvent): void {
    e.preventDefault();
    this.setState('isDragging', true);
  }

  private handleMove(e: MouseEvent): void {
    const { x, y } = this.calculateCanvasCursorPosition(
      e.clientX,
      e.clientY,
    );
    const { state, ctx } = this;

    if (this.state.isDragging) {
      const offsetLeft = (x - state.cursorPosition.x) / state.scale;
      const offsetTop = (y - state.cursorPosition.y) / state.scale;

      this.setState(
        'translate',
        (prev) => new Position(prev.x - offsetLeft, prev.y - offsetTop),
      );

      const tr = ctx.getTransform();
      tr.translateSelf(offsetLeft, offsetTop);
      ctx.setTransform(tr);
    }

    this.setState('cursorPosition', new Position(x, y));
    this.messageHandler<MessageEvent.MoveCursor, Position>({
      event: MessageEvent.MoveCursor,
      data: new Position(
        (x + state.translate.x * state.scale) / state.scale,
        (y + state.translate.y * state.scale) / state.scale,
      ),
    });
  }

  private handleMoveEnd(): void {
    this.setState('isDragging', false);
  }

  setState: SetStateFn = (field, value) => {
    this.state[field] =
      typeof value === 'function' ? value(this.state[field]) : value;
  };

  registerHandlers(): void {
    const { canvas } = this;

    canvas.addEventListener('wheel', this.handleZoom.bind(this));
    canvas.addEventListener('mousedown', this.handleMoveStart.bind(this));
    canvas.addEventListener('mousemove', this.handleMove.bind(this));
    canvas.addEventListener('mouseup', this.handleMoveEnd.bind(this));
    canvas.addEventListener('mouseleave', this.handleMoveEnd.bind(this));
  }

  unregisterHandlers(): void {
    const { canvas } = this;

    canvas.removeEventListener('wheel', this.handleZoom.bind(this));
    canvas.removeEventListener('mousedown', this.handleMoveStart.bind(this));
    canvas.removeEventListener('mousemove', this.handleMove.bind(this));
    canvas.removeEventListener('mouseup', this.handleMoveEnd.bind(this));
    canvas.removeEventListener('mouseleave', this.handleMoveEnd.bind(this));
  }
}
