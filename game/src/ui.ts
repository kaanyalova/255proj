import { Container, Graphics } from "pixi.js";
import { Game } from "./game";
import { Actor } from "./actor";
import { Tower } from "./Towers/tower";
import { Vector2 } from "./math";
import { GatlingGun } from "./Towers/gatling_gun";
import { Seeker } from "./Towers/tack";

const TOWER_PORTRAIT_HEIGHT = 24;
const TOWER_PORTRAIT_WIDTH = 24;

class TowerPorait extends Actor {
  sprite: Container;
  ghost: Graphics | undefined;
  isDragging: boolean = false;
  mouseOffsetX: number = 0;
  mouseOffsetY: number = 0;
  price: number;

  private spawnTower;

  constructor(
    game: Game,
    towerSpawn: (game: Game, posX: number, posY: number) => Promise<Actor>,
    towerWidth: number,
    towerHeight: number,
    sprite: Container,
    price: number
  ) {
    super(game);
    this.spawnTower = towerSpawn;
    this.sprite = sprite;
    this.price = price;
  }

  tick(game: Game, deltaTime: number): void {
    if (this.isDragging) {
      this.ghost!.x = game.controls.mouseX - this.mouseOffsetX;
      this.ghost!.y = game.controls.mouseY - this.mouseOffsetY;
    }
  }

  override async init(game: Game) {
    //this.sprite = new Graphics()
    //	.rect(4, 8, this.TOWER_PORTRAIT_HEIGHT, this.TOWER_PORTRAIT_WIDTH)
    //	.fill(0x2aaaff);

    this.ghost = new Graphics()
      .rect(4, 8, TOWER_PORTRAIT_HEIGHT, TOWER_PORTRAIT_WIDTH)
      .fill(0x000000);
    this.ghost.visible = false;
    this.ghost.zIndex = 0;

    this.sprite.zIndex = 1;
    this.sprite.x += 4;
    this.sprite.y += 4;

    this.addChild(this.sprite);
    this.addChild(this.ghost);

    this.sprite.eventMode = "static";

    this.sprite.on("mousedown", () => {
      this.isDragging = true;
      this.ghost!.visible = true;
      this.mouseOffsetX = game.controls.mouseX - this.ghost!.x;
      this.mouseOffsetY = game.controls.mouseY - this.ghost!.y;

      console.log("mousedown");
    });

    game.stage.on("mouseup", async () => {
      console.log("mouseup");
      if (this.isDragging) {
        this.isDragging = false;
        this.ghost!.visible = false;

        // green color in the map overlay
        const vaildColor = { red: 65, green: 243, blue: 113, alpha: 255 };
        const sampledOverlayPixel = game.gameMap!.getOverlayPixel(
          game.controls.mouseX,
          game.controls.mouseY
        );

        console.log({
          sample: sampledOverlayPixel,
          valid: vaildColor,
        });

        const isValidPlacement =
          vaildColor.red === sampledOverlayPixel.red &&
          vaildColor.green === sampledOverlayPixel.green &&
          vaildColor.blue === sampledOverlayPixel.blue;

        const canAfford = game.spendMoney(this.price);

        if (isValidPlacement && canAfford) {
          const tower = await this.spawnTower(
            game,
            game.controls.mouseX,
            game.controls.mouseY
          );
          game.insertActorToStage(tower);
        } else {
          console.log({ valid: vaildColor, sampled: sampledOverlayPixel });
        }

        this.ghost!.x = 0;
        this.ghost!.y = 0;
      }
    });
  }
}

export class GameUI extends Actor {
  private background: Graphics | undefined;
  private protrait: TowerPorait | undefined;

  constructor(game: Game) {
    super(game);
  }

  override async init(game: Game) {
    this.setBackground(game);
    await this.setTowers(game);
  }

  private setBackground(game: Game) {
    this.background = new Graphics()
      .rect(1, 1, 30, game.getHeight() - 2)
      .stroke({ color: 0x181818, width: 2 })
      .fill(0x373737);
    this.addChild(this.background);
  }

  private async setTowers(game: Game) {
    const spawnGatlingGunner = async (
      game: Game,
      posX: number,
      posY: number
    ) => {
      return new GatlingGun(game, posX, posY);
    };

    const sprite = new Graphics()
      .rect(0, 0, TOWER_PORTRAIT_WIDTH, TOWER_PORTRAIT_HEIGHT)
      .fill(0x0288d1);

    const portrait = new TowerPorait(
      game,
      spawnGatlingGunner,
      12,
      12,
      sprite,
      10
    );
    game.registerActor(portrait);
    this.addChild(portrait);
    portrait.x = 0;
    portrait.y = 0;

    const spawnSeeking = async (game: Game, posX: number, posY: number) => {
      return new Seeker(game, posX, posY);
    };

    const sprite2 = new Graphics()
      .rect(0, 0, TOWER_PORTRAIT_WIDTH, TOWER_PORTRAIT_HEIGHT)
      .fill(0x78521a);

    const portrait2 = new TowerPorait(game, spawnSeeking, 12, 12, sprite2, 20);
    game.registerActor(portrait2);
    this.addChild(portrait2);
    portrait2.x = 0;
    portrait2.y = 28;
  }
}
