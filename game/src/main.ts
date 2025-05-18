import { Application, Assets, Sprite } from 'pixi.js';
import { Game } from './game';

export async function initPixi(scale: number) {
    const canvasDiv = document.getElementsByClassName(
        'canvas'
    )[0] as HTMLElement;

    // Create a new application
    const app = new Application();

    // Initialize the application
    await app.init({ background: '#1099bb', resizeTo: canvasDiv });
    canvasDiv.appendChild(app.canvas);

    const game = new Game(app, scale);
    await game.run();

    app.ticker.add((deltaTime) => {
        game.tick(deltaTime);
    });

    app.stage.scale = scale;

    /*
	// Append the application canvas to the document body
	canvasDiv.appendChild(app.canvas);

	// Load the bunny texture
	const texture = await Assets.load('https://pixijs.com/assets/bunny.png');

	// Create a bunny Sprite
	const bunny = new Sprite(texture);

	app.stage.addChild();

	// Center the sprite's anchor point
	bunny.anchor.set(0.5);

	// Move the sprite to the center of the screen
	bunny.x = app.screen.width / 2;
	bunny.y = app.screen.height / 2;

	// Listen for animate update
	app.ticker.add((time) => {
		// Just for fun, let's rotate mr rabbit a little.
		// * Delta is 1 if running at 100% performance *
		// * Creates frame-independent transformation *
	});
	*/
}
