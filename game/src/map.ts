import { Assets, Container, Sprite } from "pixi.js";
import type { Game } from "./game";
import { Actor } from "./actor";
import { Enemy } from "./Enemies/enemy";

type Color = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
};

export type MapNode = {
  x: number;
  y: number;
};

export type MapNodes = {
  enterance: MapNode;
  nodes: Array<MapNode>;
};

type Wave = {
  type: "wave";
  color: string;
  health: number;
  speed: number;
  spacing: number;
  count: number;
};

type WaveWait = {
  type: "wait";
  wait: number;
};

export class GameMap extends Actor {
  overlayWidth: number | undefined;
  overlayHeight: number | undefined;
  private overlayBytes: Uint8Array | undefined;
  private mapSprite: Sprite | undefined;
  mapNodes: MapNodes | undefined;
  waves: Array<Array<Wave | WaveWait>> | undefined;

  roundIdx: number = 0; // rounds
  private waveIdx: number = 0; // waves inside rounds
  private waveInnerIdx: number = 0; // enemies inside waves

  private waveTimer: number = 0;

  override async init(game: Game) {
    console.log("init map");

    await this.loadOverlay();
    await this.loadDisplay(game);
    await this.loadNodes();
    await this.loadWaves();
  }

  private async loadOverlay() {
    const overlayReq = await fetch("/game/assets/overlay.png");
    const overlayBytes = await overlayReq.bytes();

    // very new api https://caniuse.com/?search=ImageDecoder
    // alternatively i can use the canvas api instead
    let imageDecoder = new ImageDecoder({
      data: overlayBytes,
      type: "image/png",
    });
    let decodedOverlay = await imageDecoder.decode();

    const size = decodedOverlay.image.allocationSize();
    const buffer = new ArrayBuffer(size);
    decodedOverlay.image.copyTo(buffer);

    this.overlayHeight = decodedOverlay.image.codedHeight;
    this.overlayWidth = decodedOverlay.image.codedWidth;
    this.overlayBytes = new Uint8Array(buffer);
  }

  private async loadDisplay(game: Game) {
    const mapDisplay = await Assets.load("/game/assets/map.png");
    const mapSprite = new Sprite(mapDisplay);
    this.mapSprite = mapSprite;

    this.addChild(this.mapSprite);
  }

  private async loadNodes() {
    const nodesReq = await fetch("/game/assets/map_nodes.json");
    const nodes: MapNodes = await nodesReq.json();
    this.mapNodes = nodes;
    console.log("load nodes");
  }

  getOverlayPixel(x: number, y: number): Color {
    if (this.overlayBytes) {
      const pixelOffset =
        (Math.round(y) * this.overlayWidth!! + Math.round(x)) * 4; // each pixel is 4 bytes
      const pixel: Color = {
        red: this.overlayBytes[pixelOffset + 0],
        green: this.overlayBytes[pixelOffset + 1],
        blue: this.overlayBytes[pixelOffset + 2],
        alpha: this.overlayBytes[pixelOffset + 3],
      };
      return pixel;
    }

    console.error("couldnt get pixel");

    return {
      red: 0,
      green: 0,
      blue: 0,
      alpha: 0,
    };
  }

  private async loadWaves() {
    const wavesReq = await fetch("/game/assets/map_waves.json");
    const wavesJSON = await wavesReq.json();

    this.waves = wavesJSON;
  }

  private processWaves(game: Game) {
    const roundCount = this.waves!.length;

    if (this.roundIdx >= roundCount) {
      return;
    }

    const thisRound = this.waves![this.roundIdx];
    const waveCount = thisRound.length;

    if (this.waveIdx >= waveCount) {
      this.roundIdx += 1;
      this.waveIdx = 0;
      console.log(`start round idx ${this.roundIdx}`);
    }

    if (this.waves && this.waveTimer <= 0 && this.waveIdx < thisRound.length) {
      const thisWave = thisRound[this.waveIdx];

      if (thisWave.type === "wave") {
        if (this.waveInnerIdx < thisWave.count) {
          const enemy = new Enemy(
            game,
            thisWave.speed,
            thisWave.color,
            thisWave.health
          );
          game.insertActorToStage(enemy);
          this.waveTimer += thisWave.spacing * 10;
          this.waveInnerIdx += 1;
        } else {
          this.waveIdx += 1;
          this.waveInnerIdx = 0;
        }
      }

      if (thisWave.type === "wait") {
        this.waveTimer += thisWave.wait;
        this.waveIdx += 1;
        this.waveInnerIdx = 0;
      }
    }
  }

  override tick(game: Game, deltaTime: number): void {
    this.processWaves(game);

    this.waveTimer -= deltaTime;
  }
}
