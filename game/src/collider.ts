import { Point, Rectangle } from '@pixi/math';
import { lineIntersection } from '@pixi/math-extras';
import type { Vector2 } from './math';

export enum ColliderType {
	BULLET,
	ENEMY,
	TOWER
}
export class Collider {
	shapes: Array<Rectangle> = [];
	// the callback that runs when another collider collides with this one
	onGetHit: undefined | ((args?: any) => void);
	args: any;
	uuid: string;
	colliderType: ColliderType;

	constructor(shapes: Array<Rectangle>, type: ColliderType) {
		this.shapes = shapes;
		this.uuid = crypto.randomUUID();
		this.colliderType = type;
	}

	// lol no function overloading
	static single(shape: Rectangle, type: ColliderType): Collider {
		return new Collider([shape], type);
	}

	collidesWithOther(other: Collider): boolean {
		return this.shapes.some((thisCollider) =>
			// if any of the collisions here is true, the function should propagate to true
			other.shapes.some((otherCollider) => thisCollider.intersects(otherCollider))
		);
	}

	moveTo(x: number, y: number) {
		this.shapes.forEach((shape) => {
			shape.x = x;
			shape.y = y;
		});
	}

	// check collision between ray cast from the center of self with other,
	// only works with the first shape of the collider
	static rayCast(self: Rectangle, other: Rectangle, ray: Vector2): boolean {
		// (0,0), (width,0)
		const topEdge = [
			{ x: other.x, y: other.y },
			{ x: other.x + other.width, y: other.y }
		];

		// (0,0), (0, height)
		const leftEdge = [
			{ x: other.x, y: other.y },
			{ x: other.x, y: other.y + other.height }
		];

		// (width, 0), (width, height)
		const rightEdge = [
			{
				x: other.x + other.width,
				y: other.y
			},
			{
				x: other.x + other.width,
				y: other.y + other.height
			}
		];

		// (0, height), (width, height)
		const bottomEdge = [
			{
				x: other.x,
				y: other.y + other.height
			},
			{
				x: other.x + other.width,
				y: other.y + other.height
			}
		];

		const centerOfSelf = {
			x: self.x + self.width / 2,
			y: self.y + self.height / 2
		};
		const vectorFromSelf = [
			{
				x: centerOfSelf.x,
				y: centerOfSelf.y
			},

			{
				x: centerOfSelf.x + ray.x,
				y: centerOfSelf.y + ray.y
			}
		];

		const topIntersect = this.doesLineIntersect(
			vectorFromSelf[0],
			vectorFromSelf[1],
			topEdge[0],
			topEdge[1]
		);
		const leftIntersect = this.doesLineIntersect(
			vectorFromSelf[0],
			vectorFromSelf[1],
			leftEdge[0],
			leftEdge[1]
		);
		const rightIntersect = this.doesLineIntersect(
			vectorFromSelf[0],
			vectorFromSelf[1],
			rightEdge[0],
			rightEdge[1]
		);
		const bottomIntersect = this.doesLineIntersect(
			vectorFromSelf[0],
			vectorFromSelf[1],
			bottomEdge[0],
			bottomEdge[1]
		);

		// if any of the lines intersect with the vector coming from the center of the object
		return topIntersect || bottomIntersect || leftIntersect || rightIntersect;
	}

	private static ccw(a: SimplePoint, b: SimplePoint, c: SimplePoint): boolean {
		return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
	}

	// https://stackoverflow.com/a/9997374
	// I have no idea about about how this stuff works
	private static doesLineIntersect(
		x1: SimplePoint,
		y1: SimplePoint,
		x2: SimplePoint,
		y2: SimplePoint
	): boolean {
		return (
			this.ccw(x1, x2, y2) !== this.ccw(y1, x2, y2) && this.ccw(x1, y1, x2) !== this.ccw(x1, y1, y2)
		);
	}

	private static isPointValid(p: Point): boolean {
		if (!Number.isNaN(p.x) && !Number.isNaN(p.y)) {
			return true;
		} else {
			return false;
		}
	}
}

type SimplePoint = {
	x: number;
	y: number;
};
