class Path {
    constructor(points) {
        this.points = points;
    }

    display(tolerance = 25) {
        // Draw the path lines
        push();
        strokeWeight(0);
        noFill();
        beginShape();
        for (let p of this.points) vertex(p.x, p.y);
        endShape();
        pop();

        // Draw the tolerance area visually (for debugging)
        push();
        noFill();
        beginShape();
        for (let p of this.points) vertex(p.x, p.y);
        endShape();
        pop();
    }

    // Helper: check if a point is near the path (used to block tower placement)
    isOnPath(x, y, tolerance = 25) {
        // Loop through each segment of the path
        for (let i = 0; i < this.points.length - 1; i++) {
            let p1 = this.points[i];
            let p2 = this.points[i + 1];

            // Calculate the perpendicular distance from (x, y) to the segment p1→p2
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let lenSq = dx * dx + dy * dy;
            let t = ((x - p1.x) * dx + (y - p1.y) * dy) / lenSq;

            // Clamp t to stay within the segment (0 ≤ t ≤ 1)
            t = constrain(t, 0, 1);

            // Find the closest point on the segment
            let closestX = p1.x + t * dx;
            let closestY = p1.y + t * dy;

            // Distance from mouse to the closest point on the segment
            let d = dist(x, y, closestX, closestY);
            if (d < tolerance) return true; // Too close to the path
        }
        return false;
    }

}