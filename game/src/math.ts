export class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  normalize(): Vector2 {
    const length = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));

    if (length === 0) {
      console.error("tried to divide by 0 when normalizing");
    }
    const normalized_x = this.x / length;
    const normalized_y = this.y / length;

    return new Vector2(normalized_x, normalized_y);
  }

  static unit(): Vector2 {
    return new Vector2(1, 1);
  }

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  mult(other: Vector2) {
    return new Vector2(this.x * other.x, this.y * other.y);
  }

  multWithNum(other: number) {
    return new Vector2(this.x * other, this.y * other);
  }
}
