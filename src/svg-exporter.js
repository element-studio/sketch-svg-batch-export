import SketchDOM from 'sketch/dom';
import SketchUI from 'sketch/ui';

import svgo from './svgo';

const svgOptimizer = new svgo.default({
  plugins: [
    {
      removeXMLNS: true
    },{
      removeUselessStrokeAndFill: true,
    },{
      removeDimensions: true
    },
    {
      removeAttrs: {attrs: '(fill|fill-rule)'},
    }
      // addAttributesToSVGElement: {
      //   attributes:['id="#icon-account"']
      // }
    // }

    // if we can dynamically pass a value here, we can use this SVGO plugin
    // to generate the ID rather than more manual str replacement which
    // will feel a bit slicker
  ],
  js2svg: {
    pretty:true,
    indent:4
  }
});

export default function() {
  const doc = SketchDOM.getSelectedDocument()
  const selectedLayers = doc.selectedLayers

  if (selectedLayers.isEmpty) {
    SketchUI.message('No layers are selected.')
    return false;
  }

  let batchString = '';
  const pasteBoard = NSPasteboard.generalPasteboard();

  let layers = selectedLayers.map(layer => {

    let iconID = layer.name.replace('icons/','icon-');

    // make a bit more dynamic - delimit layer name by /, pick the last bit, append
    // to a prefix that can optionally set (but have icon- as a default)

    let buffer = SketchDOM.export(layer,{
      formats:'svg',
      output:false
    });

    svgOptimizer.optimize(buffer.toString()).then(result => {

      let replaceOpeningTag = result.data.replace('<svg','<symbol id="'+iconID+'"');
      let replaceClosingTag = replaceOpeningTag.replace('</svg>','</symbol>');

      batchString = batchString + replaceClosingTag;

    });

  });

  Promise.all(layers).then(() => {
    pasteBoard.declareTypes_owner([NSPasteboardTypeString], null);
    pasteBoard.setString_forType( batchString, NSPasteboardTypeString );

    SketchUI.message('SVG code copied to clipboard!');
  });

}
