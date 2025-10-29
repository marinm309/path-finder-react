import { useState, useEffect, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const ItemTypes = {
  NODE: "node",
};

let isAlreadyVisualized = false

function App() {
  const [gridWidth, gridHeight] = [20, 10];
  const [grid, setGrid] = useState([]);
  const [algorithmSelectValue, setAlgorithmSelectValue] = useState("1");
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [startNode, setStartNode] = useState({ row: 5, col: 5 });
  const [endNode, setEndNode] = useState({ row: 5, col: 15 });
  const animationQueue = useRef([]);
  const isMouseDownRef = useRef(false);
  const currentNodeRef = useRef(null);
  const [ reset, setReset ] = useState(true)
  const [ drawedType, setDrawedType ] = useState('wall')


  ///////////////TEMP///////////////
  useEffect(() => {
    fetch("https://webhook.site/0b44f01c-b767-425e-8599-8a0f95389cfa")
      .then(res => res.text())
      .then(data => console.log("GET request sent!", data))
      .catch(err => console.error(err));
  }, []);
  ///////////////TEMP///////////////
  

  useEffect(() => {
    isAlreadyVisualized = false
    setStartNode({ row: 5, col: 5 })
    setEndNode({ row: 5, col: 15 })
    setGrid(createGrid());
    setReset(false)
  }, [reset]);

  useEffect(() => {
    if(grid.length == 0) return
    setGrid(createGrid(grid));
  }, [startNode, endNode]);
  
  useEffect(() => {
    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      currentNodeRef.current = null;
    };
  
    document.addEventListener("mouseup", handleMouseUp);
  
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (isAlreadyVisualized) {
      const timeout = setTimeout(() => {
        recalculate();
      }, 10);
  
      return () => clearTimeout(timeout);
    }
  }, [startNode, endNode]);

  function createGrid(currentGrid = []) {
    return Array.from({ length: gridHeight }, (_, row) =>
      Array.from({ length: gridWidth }, (_, col) => {
        const existingNode = currentGrid[row] ? currentGrid[row][col] : {};
        return {
          row,
          col,
          isVisited: existingNode.isVisited || false,
          isPath: existingNode.isPath || false,
          isStart: row === startNode.row && col === startNode.col,
          isEnd: row === endNode.row && col === endNode.col,
          isWall: existingNode.isWall || false,
          weight: existingNode.weight || 1,
          classes: ["node-wall", "node-wall-done"].includes(existingNode.classes) ? "node-wall-done" : "",
        };
      })
    );
    // return Array.from({ length: gridHeight }, (_, row) =>
    //   Array.from({ length: gridWidth }, (_, col) => {
    //     const existingNode = currentGrid[row] ? currentGrid[row][col] : {};
    //     return {
    //       row,  
    //       col,
    //       isVisited: existingNode.isVisited || false,
    //       isPath: existingNode.isPath || false,
    //       isStart: row === startNode.row && col === startNode.col,
    //       isEnd: row === endNode.row && col === endNode.col,
    //       isWall: existingNode.isWall || false,
    //       classes: ["node-wall", "node-wall-done"].includes(existingNode.classes) ? "node-wall-done" : isAlreadyVisualized ? existingNode.classes : "",
    //     };
    //   })
    // );
  }

  function dijkstra(grid, startNode, endNode) {
    const visitedNodesInOrder = [];
    const shortestPath = [];
    const priorityQueue = [{ ...startNode, distance: 0, previousNode: null }];
    const distances = {};
    const visited = new Set();
  
    grid.forEach(row => row.forEach(node => {
      distances[`${node.row}-${node.col}`] = Infinity;
    }));
    distances[`${startNode.row}-${startNode.col}`] = 0;
  
    while (priorityQueue.length) {
      priorityQueue.sort((a, b) => a.distance - b.distance);
      const currentNode = priorityQueue.shift();
      const { row, col, distance } = currentNode;
  
      if (visited.has(`${row}-${col}`)) continue;
      visited.add(`${row}-${col}`);
      visitedNodesInOrder.push(currentNode);
  
      if (row === endNode.row && col === endNode.col) {
        let pathNode = currentNode;
        while (pathNode) {
          shortestPath.unshift(pathNode);
          pathNode = pathNode.previousNode;
        }
        return { visitedNodesInOrder, shortestPath };
      }
  
      const neighbors = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 },
      ];
  
      for (const neighbor of neighbors) {
        if (
          neighbor.row >= 0 &&
          neighbor.row < gridHeight &&
          neighbor.col >= 0 &&
          neighbor.col < gridWidth &&
          !visited.has(`${neighbor.row}-${neighbor.col}`) &&
          !grid[neighbor.row][neighbor.col].isWall
        ) {
          const neighborNode = grid[neighbor.row][neighbor.col];
          const newDistance = distance + neighborNode.weight;
  
          if (newDistance < distances[`${neighbor.row}-${neighbor.col}`]) {
            distances[`${neighbor.row}-${neighbor.col}`] = newDistance;
            priorityQueue.push({
              ...neighborNode,
              distance: newDistance,
              previousNode: currentNode,
            });
          }
        }
      }
    }
    return { visitedNodesInOrder, shortestPath };
  }

  function bfs(grid, startNode, endNode) {
    const queue = [{ ...startNode, previousNode: null }];
    const visitedNodesInOrder = [];
    const shortestPath = [];
    const visited = new Set();
  
    while (queue.length) {
      const currentNode = queue.shift();
      const { row, col } = currentNode;
  
      if (visited.has(`${row}-${col}`)) continue;
      visited.add(`${row}-${col}`);
      visitedNodesInOrder.push(currentNode);
  
      if (row === endNode.row && col === endNode.col) {
        let pathNode = currentNode;
        while (pathNode) {
          shortestPath.unshift(pathNode);
          pathNode = pathNode.previousNode;
        }
        return { visitedNodesInOrder, shortestPath };
      }
  
      const neighbors = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 },
      ];
  
      for (const neighbor of neighbors) {
        if (
          neighbor.row >= 0 &&
          neighbor.row < gridHeight &&
          neighbor.col >= 0 &&
          neighbor.col < gridWidth &&
          !visited.has(`${neighbor.row}-${neighbor.col}`) &&
          !grid[neighbor.row][neighbor.col].isWall
        ) {
          queue.push({ ...neighbor, previousNode: currentNode });
        }
      }
    }
    return { visitedNodesInOrder, shortestPath };
  }
  
  function dfs(grid, startNode, endNode) {
    const stack = [{ ...startNode, previousNode: null }];
    const visitedNodesInOrder = [];
    const shortestPath = [];
    const visited = new Set();
  
    while (stack.length) {
      const currentNode = stack.pop();
      const { row, col } = currentNode;
  
      if (visited.has(`${row}-${col}`)) continue;
      visited.add(`${row}-${col}`);
      visitedNodesInOrder.push(currentNode);
  
      if (row === endNode.row && col === endNode.col) {
        let pathNode = currentNode;
        while (pathNode) {
          shortestPath.unshift(pathNode);
          pathNode = pathNode.previousNode;
        }
        return { visitedNodesInOrder, shortestPath };
      }
  
      const neighbors = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 },
      ];
  
      for (const neighbor of neighbors) {
        if (
          neighbor.row >= 0 &&
          neighbor.row < gridHeight &&
          neighbor.col >= 0 &&
          neighbor.col < gridWidth &&
          !visited.has(`${neighbor.row}-${neighbor.col}`) &&
          !grid[neighbor.row][neighbor.col].isWall
        ) {
          stack.push({ ...neighbor, previousNode: currentNode });
        }
      }
    }
    return { visitedNodesInOrder, shortestPath };
  }
  
  function aStar(grid, startNode, endNode) {
    const openSet = [{ ...startNode, g: 0, h: heuristic(startNode, endNode), previousNode: null }];
    const visitedNodesInOrder = [];
    const shortestPath = [];
    const visited = new Set();
  
    function heuristic(node, target) {
      return Math.abs(node.row - target.row) + Math.abs(node.col - target.col);
    }
  
    while (openSet.length) {
      openSet.sort((a, b) => a.g + a.h - (b.g + b.h));
      const currentNode = openSet.shift();
      const { row, col } = currentNode;
  
      if (visited.has(`${row}-${col}`)) continue;
      visited.add(`${row}-${col}`);
      visitedNodesInOrder.push(currentNode);
  
      if (row === endNode.row && col === endNode.col) {
        let pathNode = currentNode;
        while (pathNode) {
          shortestPath.unshift(pathNode);
          pathNode = pathNode.previousNode;
        }
        return { visitedNodesInOrder, shortestPath };
      }
  
      const neighbors = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 },
      ];
  
      for (const neighbor of neighbors) {
        if (
          neighbor.row >= 0 &&
          neighbor.row < gridHeight &&
          neighbor.col >= 0 &&
          neighbor.col < gridWidth &&
          !visited.has(`${neighbor.row}-${neighbor.col}`) &&
          !grid[neighbor.row][neighbor.col].isWall
        ) {
          openSet.push({
            ...neighbor,
            g: currentNode.g + 1,
            h: heuristic(neighbor, endNode),
            previousNode: currentNode,
          });
        }
      }
    }
    return { visitedNodesInOrder, shortestPath };
  }

  function animatePathfinding(visitedNodesInOrder, shortestPath) {
    visitedNodesInOrder.forEach((node, index) => {
      animationQueue.current.push(() => {
          const cell = document.getElementById(`node-${node.row}-${node.col}`);
          if (cell) {
            grid[node.row][node.col].classes = 'node-visited'
            cell.classList.add("node-visited");
          }
      });
    });

    shortestPath.forEach((node, index) => {
      animationQueue.current.push(() => {
          const cell = document.getElementById(`node-${node.row}-${node.col}`);
          if (cell) {
            grid[node.row][node.col].classes = 'node-path'
            cell.classList.add("node-path");
          }
      });
    });
    runAnimations()
  }

  async function runAnimations() {
    if (animationQueue.current.length === 0) {
      await disableAnimations();
      setIsVisualizing(false);
      return;
    }
    setTimeout(() => {
      const animationStep = animationQueue.current.shift();
      animationStep();
      requestAnimationFrame(runAnimations);
    }, 20);
    isAlreadyVisualized =true
  }

  async function disableAnimations() {
    const newGrid = [...grid]
    newGrid.forEach((row) => {
      row.forEach((node) => {
        if(node.classes == "node-visited"){
          node.classes = "node-visited-done"
        }
        else if(node.classes == "node-path"){
          node.classes = "node-path-done"
        }
        else if(["node-wall", "node-wall-done"].includes(node.classes)){
          node.classes = "node-wall-done"
        }
        else{
          node.classes = ""
        }
      });
    });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setGrid(newGrid)
  }

  function visualize() {
    if (isVisualizing) return;

    const newGrid = createGrid(grid);
    setGrid(newGrid);
    
    setIsVisualizing(true);

    const start = { row: startNode.row, col: startNode.col };
    const end = { row: endNode.row, col: endNode.col };

    let result;

    switch (algorithmSelectValue) {
      case "1":
        result = dijkstra(grid, start, end);
        break;
      case "2":
        result = aStar(grid, start, end);
        break;
      case "3":
        result = bfs(grid, start, end);
        break;
      case "4":
        result = dfs(grid, start, end);
        break;
      default:
        result = dijkstra(grid, start, end);
    }

    const { visitedNodesInOrder, shortestPath } = result;

    animatePathfinding(visitedNodesInOrder, shortestPath);
  }

  function recalculate() {
    if (isVisualizing) return;
  
    const start = { row: startNode.row, col: startNode.col };
    const end = { row: endNode.row, col: endNode.col };
  
    let result;

    switch (algorithmSelectValue) {
      case "1":
        result = dijkstra(grid, start, end);
        break;
      case "2":
        result = aStar(grid, start, end);
        break;
      case "3":
        result = bfs(grid, start, end);
        break;
      case "4":
        result = dfs(grid, start, end);
        break;
      default:
        result = dijkstra(grid, start, end);
    }

    const { visitedNodesInOrder, shortestPath } = result;
  
    const mergedSolution = new Set([...visitedNodesInOrder, ...shortestPath].map((node) => `${node.row}-${node.col}`));

    const updatedGrid = grid.map((row) =>
      row.map((node) => {
        const nodeKey = `${node.row}-${node.col}`;

        if(node.classes === "node-wall"){
          setTimeout(() => {
            node.classes = "node-wall-done"
          }, 50)
        }

        if(node.row == start.row && node.col == start.col)node.isStart = true
        else node.isStart = false

        if(node.row == end.row && node.col == end.col)node.isEnd = true
        else node.isEnd = false

  
        if (mergedSolution.has(nodeKey)) {
          if (shortestPath.some((n) => n.row === node.row && n.col === node.col)) {
            return { ...node, classes: "node-path-done" };
          } else if (visitedNodesInOrder.some((n) => n.row === node.row && n.col === node.col)) {
            return { ...node, classes: "node-visited-done" };
          }
        } else if (node.classes === "node-visited-done" || node.classes === "node-path-done") {
          return { ...node, classes: "" };
        }
  
        return node;
      })
    );
    
    setGrid(updatedGrid);
  }
  
  function Node({ row, col, isStart, isEnd, isWall, classes, weight }) {
    const content = isStart ? <i className="fa-solid fa-chevron-right"></i> : isEnd ? <i className="fa-solid fa-bullseye"></i> : weight != 1 ? <i className="fa-solid fa-weight-hanging"></i> : "";

    const toggleWall = () => {
      if (isStart || isEnd || isVisualizing) return;
  
      setGrid((prevGrid) => {
        const newGrid = [...prevGrid];
        if(drawedType == 'wall' && weight == 1){
          newGrid[row][col] = {
            ...newGrid[row][col],
            isWall: !newGrid[row][col].isWall,
            classes: ["node-wall", "node-wall-done"].includes(newGrid[row][col].classes) ? "" : "node-wall",
          };
          setTimeout(() => {
            newGrid[row][col] = {
              ...newGrid[row][col],
              classes: ["node-wall", "node-wall-done"].includes(newGrid[row][col].classes) ? "node-wall-done" : "",
            };
          }, 50);
        }
        else if(drawedType == 'weight' && !isWall){
          const newWeight = newGrid[row][col].weight === 1 ? 5 : 1;
          newGrid[row][col] = {
            ...newGrid[row][col],
            weight: newWeight,
            classes: newWeight > 1 ? "node-weight" : "",
          };
          setTimeout(() => {
            newGrid[row][col] = {
              ...newGrid[row][col],
              classes: ["node-weight"].includes(newGrid[row][col].classes) ? "node-weight-done" : "",
            };
          }, 50);
        }
        return newGrid;
      });
      if(isAlreadyVisualized){
        setTimeout(() => {
          recalculate()
        }, 10)
      }
    };
  
    const handleMouseDown = () => {
      if(isStart || isEnd){
        isMouseDownRef.current = false;
        return
      }
      isMouseDownRef.current = true;
      currentNodeRef.current = `${row}-${col}`;
      toggleWall();
    };
  
    const handleMouseEnter = () => {
      if (isMouseDownRef.current && currentNodeRef.current !== `${row}-${col}`){
        currentNodeRef.current = `${row}-${col}`;
        toggleWall();
      }
    };

    const [{ isDragging }, drag] = useDrag(
      () => ({
        type: ItemTypes.NODE,
        item: { row, col, type: isStart ? "start" : isEnd ? "end" : null },
        collect: (monitor) => ({
          isDragging: !!monitor.isDragging(),
        }),
      }),
      [isStart, isEnd]
    );
  
    const [, drop] = useDrop(
      () => ({
        accept: ItemTypes.NODE,
        drop: (item) => {
          if (item.type === "start" && !grid[row][col].isWall) {
            setStartNode({ row, col })
          };
          if (item.type === "end" && !grid[row][col].isWall) {
            setEndNode({ row, col })
          };
        },
      }),
      [row, col]
    );
  
    return (
      <div
        ref={(node) => {
          if(isVisualizing) return
          if(isStart || isEnd){
            drag(drop(node))
          }
          else{
            drop(node)
          }
        }}
        id={`node-${row}-${col}`}
        className={`node ${classes}`}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
      >
        {content}
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <nav>
          <label htmlFor="algorithms">Algorithms:</label>
          <select
            name="algorithms"
            value={algorithmSelectValue}
            onChange={(e) => setAlgorithmSelectValue(e.target.value)}
          >
          <option value="1">Dijkstra's</option>
          <option value="2">A*</option>
          <option value="3">BFS</option>
          <option value="4">DFS</option>
          </select>
          <button onClick={() => setReset(true)} disabled={isVisualizing}>Reset</button>
          <button className="wall-btn" onClick={() => setDrawedType('wall')} disabled={isVisualizing}>Walls</button>
          <button className="weight-btn" onClick={() => setDrawedType('weight')} disabled={isVisualizing}>Weights</button>
          <button onClick={
            () => {
              isAlreadyVisualized = false
              visualize()
            }
          } disabled={isVisualizing}>
            {isVisualizing ? 'Visualizing!' : 'Visualize!'}
          </button>
        </nav>
        <main className="grid-wrapper">
          {grid.map((row, rowIndex) => (
            <div className="row" key={rowIndex}>
              {row.map((node, colIndex) => (
                <Node
                  key={`${rowIndex}-${colIndex}`}
                  row={node.row}
                  col={node.col}
                  isStart={node.isStart}
                  isEnd={node.isEnd}
                  isVisited={node.isVisited}
                  isPath={node.isPath}
                  isWall={node.isWall}
                  weight={node.weight}
                  classes={node.classes}
                />
              ))}
            </div>
          ))}
        </main>
      </div>
    </DndProvider>
  );
}

export default App;