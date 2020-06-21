'use strict';
const PNG = require('pngjs').PNG;
const fs = require('fs');
const [, , imgPath, outputPath] = process.argv;

/**
 * NOTES 
 *         
//CONDITONS:
//A: A pixel has transparency to the left of a solid edge at +1x
//B: A pixel has transparency to the right of a solid edge at -1x
//C: A pixel has transparency to the left and the right of separate solid edges.

//A: Place a vertex at +1x.
//B: Place a vertex at -1X.
//C: Place a vertex at +1X AND -1X.

Float values are irrelevant in the sense that we can get the general shape of the image better without snapping to pixels.  
When examining the pixels themselves, this approach will force us to have to apply a 'brush' of pixels along the vector lines. 


 * 
 * */


class ImgGrid {
    constructor(img, outputImg = false) {
        this.img = img != null && this.isPixelData(img.data) ? img.data : null;
        this.imgFile = img; 
        let w = img.width; 
        let h = img.height; 
        this.outputName = outputImg; 
        this.outPutImage = outputImg ? img.data : null;

        this.imgWidth = this.img ? img.width : 0;
        this.imgHeight = this.img ? img.height : 0;
        this.points = this.generatePoints();
    }


    isPixelData(arr) {
        // work around instanceof Uint8Array not working properly in some Jest environments
        return ArrayBuffer.isView(arr) && arr.constructor.BYTES_PER_ELEMENT === 1;
    }

    generatePoints() {
        let returnArray = []; 
        for (let x = 0; x < this.imgWidth; x++) {
            for (let y = 0; y < this.imgHeight; y++) {
               if (y == this.imgHeight-1 && typeof this.maxY == 'undefined') { 
                   this.maxY = y; 
               }

            }
            if (x == this.imgWidth-1 && typeof this.maxX == 'undefined') {
                this.maxX = x; 
            }
        }

         for (let x = 0; x < this.imgWidth; x++) {
            for (let y = 0; y < this.imgHeight; y++) {
                let point = new Point(x, y, this.imgWidth, this.imgHeight, this.maxX, this.maxY);
                returnArray.push(point); 
            }
        }
         
         
        return returnArray; 
    }

    getPoint(x, y) {
        for (let point of this.points) {
            if (point.pX == x && point.pY == y) {
                return point;
            }
        }    
    }

    colorAtPoint(x, y) {
        let p = new Point(x, y, this.imgWidth, this.imgHeight, this.maxX, this.maxY); 
        let pixelIndex = p.pixelNumber * 4; 

        let r = this.img[pixelIndex + 0];
        let g = this.img[pixelIndex + 1];
        let b = this.img[pixelIndex + 2];
        let a = this.img[pixelIndex + 3]; 

        console.log(this.outPutImage);
        this.outPutImage[pixelIndex + 0] = r;
        this.outPutImage[pixelIndex + 1] = g;
        this.outPutImage[pixelIndex + 2] = b;
        this.outPutImage[pixelIndex + 3] = a;

        return { r: r, g: g, b: b, a: a }; 
    }

    drawPixel(pos, c) {
        this.outPutImage[pos + 0] = c.r;
        this.outPutImage[pos + 1] = c.g;
        this.outPutImage[pos + 2] = c.b;
        this.outPutImage[pos + 3] = c.a;
    }

    saveOutput() {
        this.imgFile.data = this.outPutImage; 
        let buffer = PNG.sync.write(this.imgFile);
        fs.writeFileSync(this.outputName+'.png', buffer);

    }

}


/***
 * Point
 * Constructor expects either an explcit value for X and Y, or a POS object of the following structure:
 * {x:int,y:int}
 * POS refers to the pixel position of the image in a top-down, left-right order.  
 * each point in POS is (pixel position/4).
 * 
 * If POS is provided, this.x and this.y refer to coordinates in the grid rather than the original pixel-order.  
 * */
class Point{
    constructor(x, y, width, height,maxX,maxY) {  
        this._width = width;
        this._height = height;
        this.maxX = maxX;
        this.maxY = maxY; 


        let oldTop = 0;
        let oldLeft = 0;
        let oldRight = this.maxX; 
        let oldBottom = this.maxY;

        let newLeft = -(this.maxX / 2);
        let newRight = this.maxX / 2;
        let newTop = this.maxY / 2; 
        let newBottom = -(this.maxY / 2);

        this.x = newLeft + ((x - oldLeft) / (oldRight - oldLeft)) * (newRight - newLeft);  
        this.y = newTop + ((y - oldTop) / (oldBottom - oldTop)) * (newBottom - newTop); 


        //To preserve pixel-order coordinates.  
        this._x = x;    
        this._y = y;

        //Closest pixel (preferring down-left direction) to the point.  
        this.pX = Math.floor(this.x);
        this.pY = Math.floor(this.y); 
        this.pixelIndex = (y * width + x) * 4;
    }

    get pixelNumber() {
        let px = -1;
        for (let i = 0; i <= this._x; i++) {
            px++;
            for (let ii = 0; ii <= this._y; ii++) {
                px++;
            }
        }
        return px;
    }

}






// check if a pixel has 3+ adjacent pixels of the same color.
function hasManySiblings(img, x1, y1, width, height) {
    const x0 = Math.max(x1 - 1, 0);
    const y0 = Math.max(y1 - 1, 0);
    const x2 = Math.min(x1 + 1, width - 1);
    const y2 = Math.min(y1 + 1, height - 1);
    const pos = (y1 * width + x1) * 4;
    let zeroes = x1 === x0 || x1 === x2 || y1 === y0 || y1 === y2 ? 1 : 0;

    // go through 8 adjacent pixels
    for (let x = x0; x <= x2; x++) {
        for (let y = y0; y <= y2; y++) {
            if (x === x1 && y === y1) continue;

            const pos2 = (y * width + x) * 4;
            if (img[pos] === img[pos2] &&
                img[pos + 1] === img[pos2 + 1] &&
                img[pos + 2] === img[pos2 + 2] &&
                img[pos + 3] === img[pos2 + 3]) zeroes++;

            if (zeroes > 2) return true;
        }
    }

    return false;
}




//Read the image, get its width and height.  
const img = PNG.sync.read(fs.readFileSync(imgPath));

let g = new ImgGrid(img,'test');  
