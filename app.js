'use strict';
const PNG = require('pngjs').PNG;
const fs = require('fs');
const [, , imgPath, outputPath] = process.argv;



var options = { transparency: 1.0 }; 




function getXFor(x,width) {
    return (x - (width / 2)); 
}

function getYFor(y, height) {
    let newY =  y - (height / 2)

    if (Math.sign(newY) == -1) {
        return Math.abs(newY);
    }

    else {
        return -Math.abs(newY); 
    }
}

//Intended for pixel position/4 in a top-down, left-right config.  
function getCoordsFor(x,y, width, height){
    let xCord = getXFor(x, width); 
    let yCord = getXFor(y, height); 

    return { x: xCord, y: yCord }; 
}




function getTransparency(img, output, width, height) {

    if (!isPixelData(img) || (output && !isPixelData(output)))
        throw new Error('Image data: Uint8Array, Uint8ClampedArray or Buffer expected.');

    let workingOutput = output;

    if(!output)
        workingOutput = img;

    var test = []; 
   

    //Number of pixel must be multiplied by 4 to hit the right byte
    //Pixel 0 is pixel 1

  

    //Go through the pixels and detect 
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            //Coresponds to the byte number in the array...
            const pos = (y * width + x) * 4;

          
            console.log(getCoordsFor(x,y, width, height)); 

            
            //workingOutput = drawPixel(workingOutput, pos2, { r: 234, g: 255, b: 0 });
          
           
     

            let c = color(img, pos);
            if (c.a > 220) {
                if (!output)
                        workingOutput = drawPixel(workingOutput, pos, c);
                }
            else {
                if (!output)
                        workingOutput = drawPixel(workingOutput, pos, {r: 255, g:0, b:21});
                }
          
            
        }
    }
    test.sort(function (a, b) {
        return a - b;
    }); 
    console.log(test); 
    
    if (!output)  
        return { out: workingOutput, data: false }; 
    return { data: false }; 

}

function isPixelData(arr) {
    // work around instanceof Uint8Array not working properly in some Jest environments
    return ArrayBuffer.isView(arr) && arr.constructor.BYTES_PER_ELEMENT === 1;
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

function color(img, k) {
    let r = img[k + 0];
    let g = img[k + 1];
    let b = img[k + 2];
    let a = img[k + 3];
    return ({
        'r': r, 'g': g, 'b': b, 'a': a
    });
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
let w = img.width; 
let h = img.height; 

const outputImage = outputPath ? new PNG({ w, h }) : null;

//Get the transparency arrays and prep the output image, if the user asked for it.  


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



