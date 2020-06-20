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
        this.outPutImage = outputImg ? new PNG({ w, h }).data : null;

        this.imgWidth = this.img ? img.width : 0;
        this.imgHeight = this.img ? img.height : 0;
        this.points = this.generatePoints();

        //console.log("CENTER POINT IS: "); 
        this.getPoint(0, 0)
        //console.log(this.getPoint(0, 0)); 
        this.getPixelAt(0, 0); 
    }


    isPixelData(arr) {
        // work around instanceof Uint8Array not working properly in some Jest environments
        return ArrayBuffer.isView(arr) && arr.constructor.BYTES_PER_ELEMENT === 1;
    }

    //Points start from 0, top down, left right.  
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
            if (point.x == x && point.y == y)
                return point; 
        }
    }

    getPixelAt(x,y) {
       // console.log(x, y); 
        let point = new Point(x, y, this.imgWidth, this.imgHeight, this.maxX, this.maxY); 

        //console.log(point.x, point.y);
        //let baseHeight = 1 * this.imgWidth; 


       // console.log((point._x * (this.imgWidth * (x+1))) - (maxX-x)   ); 
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

        //New left and right get pushed over by half of the old with.  
        let newLeft = oldLeft + this.maxX / 2;
        let newRight = oldRight + this.maxX / 2;
        let newTop = oldTop + this.maxY / 2;  //New top should still be zero.
        let newBottom = oldBottom; //New Bottom should still be MaxY.

        //console.log(newLeft,newRight,newTop,newBottom); 

        this.x = newLeft + ((x - oldLeft) / (oldRight - oldLeft)) * (newRight - newLeft);  
        this.y = newTop + ((y - oldTop) / (oldBottom - oldTop)) * (newBottom - newTop); 
   
        console.log(this.x)
        console.log(this.y);

        process.exit(); 



        this._x = x;    
        this._y = y;
    }
  
    //NOTE:  Will need to inherit img from grid.  
    //NOTE:  Will need to inherit witdth and height from grid.  
    color() {  
        let r = this.img[this.pos + 0];
        let g = this.img[this.pos + 1];
        let b = this.img[this.pos + 2];
        let a = this.img[this.pos + 3];
        return ({
            'r': r, 'g': g, 'b': b, 'a': a
        });
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


function drawPixel(output, pos, c) {
    output[pos + 0] = c.r;
    output[pos + 1] = c.g;
    output[pos + 2] = c.b;
    output[pos + 3] = 255;
    return output; 
}


//Read the image, get its width and height.  
const img = PNG.sync.read(fs.readFileSync(imgPath));

let g = new ImgGrid(img); 
//let p = new Point(null,4);

//Get the transparency arrays and prep the output image, if the user asked for it.  

/*
if (outputImage) {
    let output = getTransparency(img.data, outputImage.data, img.width, img.height);

    if (output.out) {
        img.data = output.out;
        let buffer = PNG.sync.write(img);
        fs.writeFileSync('out.png', buffer);
    }

}

else {
    let output = getTransparency(img.data, false, img.width, img.height);
    console.log(output); 
}
*/


