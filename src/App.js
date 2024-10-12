import React, { useRef, useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import './index.css';

const ImageItem = ({ image, index, position, size, moveImageOnCanvas, setDragging, removeImage, resizeImage }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [{ isDragging }, ref] = useDrag({
    type: 'IMAGE',
    item: { index, position },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      setDragging(null);
    },
  });

  const [, drop] = useDrop({
    accept: 'IMAGE',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveImageOnCanvas(draggedItem.index, draggedItem.position);
      }
    },
  });

  const handleResize = (event, { size }) => {
    resizeImage(index, size);
  };

  return (
    <div
      ref={(node) => ref(drop(node))}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ResizableBox
        width={size.width}
        height={size.height}
        onResize={handleResize}
        minConstraints={[50, 50]}
        maxConstraints={[300, 300]}
        resizeHandles={isHovered ? ['se'] : []}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            border: '2px solid #007bff',
            boxSizing: 'border-box',
            opacity: isDragging ? 0.5 : 1,
            cursor: 'move',
            overflow: 'hidden',
          }}
        >
          <img
            src={URL.createObjectURL(image)}
            alt={`image-${index}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </ResizableBox>
      {isHovered && (
        <button
          className="absolute top-0 right-0 bg-red-500 text-white p-1 text-xs"
          onClick={() => removeImage(index)}
        >
          Remove
        </button>
      )}
    </div>
  );
};

const App = () => {
  const [images, setImages] = useState([]);
  const [imagePositions, setImagePositions] = useState([]);
  const [imageSizes, setImageSizes] = useState([]);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prevImages) => [...prevImages, ...files]);
    setImagePositions((prevPositions) =>
      [...prevPositions, ...files.map(() => ({ x: 0, y: 0 }))],
    );
    setImageSizes((prevSizes) =>
      [...prevSizes, ...files.map(() => ({ width: 100, height: 100 }))],
    );
  };

  const moveImageOnCanvas = (index, position) => {
    const updatedPositions = [...imagePositions];
    updatedPositions[index] = position;
    setImagePositions(updatedPositions);
  };

  const removeImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
    setImagePositions((prevPositions) => prevPositions.filter((_, i) => i !== index));
    setImageSizes((prevSizes) => prevSizes.filter((_, i) => i !== index));
  };

  const resizeImage = (index, newSize) => {
    setImageSizes((prevSizes) => {
      const newSizes = [...prevSizes];
      newSizes[index] = newSize;
      return newSizes;
    });
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const index = imagePositions.findIndex(
      (pos, i) =>
        x >= pos.x &&
        x <= pos.x + imageSizes[i].width &&
        y >= pos.y &&
        y <= pos.y + imageSizes[i].height
    );

    if (index !== -1) {
      setDraggingIndex(index);
      setDragStart({ x, y });
    }
  };

  const handleMouseMove = (e) => {
    if (draggingIndex !== null) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      setImagePositions((prevPositions) => {
        const newPositions = [...prevPositions];
        newPositions[draggingIndex] = {
          x: newPositions[draggingIndex].x + dx,
          y: newPositions[draggingIndex].y + dy,
        };
        return newPositions;
      });

      setDragStart({ x, y });
    }
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'canvas-image.png';
    link.click();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing

    images.forEach((image, index) => {
      const img = new Image();
      img.src = URL.createObjectURL(image);
      img.onload = () => {
        const { x, y } = imagePositions[index];
        const { width, height } = imageSizes[index];
        ctx.drawImage(img, x, y, width, height);
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
      };
    });
  }, [images, imagePositions, imageSizes]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col items-center justify-center h-screen">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="mb-4 p-2 border border-gray-400 rounded"
        />

        <div className="relative w-[500px] h-[500px] bg-gray-100 border border-black">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="w-full h-full border border-black"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
          {images.map((image, index) => (
            <ImageItem
              key={index}
              image={image}
              index={index}
              position={imagePositions[index]}
              size={imageSizes[index]}
              moveImageOnCanvas={moveImageOnCanvas}
              setDragging={() => { }}
              removeImage={removeImage}
              resizeImage={resizeImage}
            />
          ))}
        </div>

        <button
          onClick={downloadCanvas}
          className="mt-4 p-2 bg-blue-500 text-white rounded"
        >
          Download Canvas
        </button>
      </div>
    </DndProvider>
  );
};

export default App;
