import {useEffect, useState} from 'react';
import {FaFire} from 'react-icons/fa';
import {FiPlus, FiTrash} from 'react-icons/fi';
import {motion} from 'framer-motion';

function App() {
  return (
    <div className="h-screen w-full bg-neutral-900 text-neutral-50">
      <Board />
    </div>
  );
}

const Board = () => {
  const [cards, setCards] = useState([]);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    console.log('useEffect haschecked');
    hasChecked && localStorage.setItem('cards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    console.log('useEffect');
    const localCards = localStorage.getItem('cards');

    setCards(localCards ? JSON.parse(localCards) : []);
    setHasChecked(true);
  }, []);

  return (
    <div className="flex h-full w-full gap-3 overflow-scroll p-12">
      <Column
        title="Backlog"
        column="backlog"
        headingColor="text-neutral-500"
        cards={cards}
        setCards={setCards}
      />
      <Column
        title="TODO"
        column="todo"
        headingColor="text-yellow-200"
        cards={cards}
        setCards={setCards}
      />
      <Column
        title="In progress"
        column="progress"
        headingColor="text-blue-200"
        cards={cards}
        setCards={setCards}
      />
      <Column
        title="Complete"
        column="complete"
        headingColor="text-emerald-200"
        cards={cards}
        setCards={setCards}
      />
      <BurnBarrel setCards={setCards} />
    </div>
  );
};

const Column = ({title, headingColor, column, cards, setCards}) => {
  const [active, setActive] = useState(false);

  const highLightIndicator = (e) => {
    const indicators = getIndicators();
    clearHightlights(indicators);
    // console.log(indicators);
    const el = getNearestIndicator(e, indicators);
    el.element.style.opacity = 1;
  };

  const getNearestIndicator = (e, indicators) => {
    const DISTANCE_OFFSET = 50;

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);

        if (offset < 0 && offset > closest.offset) {
          return {offset, element: child};
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );
    return el;
  };

  const clearHightlights = (els) => {
    const indicators = els || getIndicators();

    indicators.forEach((el) => {
      el.style.opacity = 0;
    });
  };

  const getIndicators = () => {
    return Array.from(document.querySelectorAll(`[data-column="${column}"]`));
  };

  const handleDragStart = (e, card) => {
    e.dataTransfer.setData('cardId', card.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    highLightIndicator(e);
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
    clearHightlights();
  };

  const handleDragDrop = (e) => {
    setActive(false);
    clearHightlights();

    const cardId = e.dataTransfer.getData('cardId');

    const indicators = getIndicators();
    const {element} = getNearestIndicator(e, indicators);

    const before = element.dataset.before || '-1';

    if (before !== cardId) {
      let copy = [...cards];

      let cardToTransfer = copy.find((c) => c.id === cardId);
      if (!cardToTransfer) return;

      cardToTransfer = {...cardToTransfer, column};

      copy = copy.filter((c) => c.id !== cardId);

      const moveToBack = before === '-1';

      if (moveToBack) {
        copy.push(cardToTransfer);
      } else {
        const insertAtIndex = copy.findIndex((c) => c.id === before);
        if (insertAtIndex === undefined) return;

        copy.splice(insertAtIndex, 0, cardToTransfer);
      }

      setCards(copy);
    }
  };

  const filteredCards = cards.filter((card) => card.column === column);

  return (
    <div className="w-56 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-medium ${headingColor}`}>{title}</h3>
        <span className="rounded text-sm text-neutral-400">{filteredCards.length}</span>
      </div>
      <div
        onDrop={handleDragDrop}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        className={`h-full w-full transition-colors ${active ? 'bg-neutral-800/50' : 'bg-neutral-800/0'}`}
      >
        {filteredCards.map((c) => (
          <Card
            key={c.id}
            {...c}
            handleDragStart={handleDragStart}
          />
        ))}
        <DropIndicator
          beforeId={'-1'}
          column={column}
        />
        <AddCard
          column={column}
          setCards={setCards}
        />
      </div>
    </div>
  );
};

const Card = ({id, title, column, handleDragStart}) => {
  return (
    <>
      <DropIndicator
        beforeId={id}
        column={column}
      />
      <motion.div
        layout
        layoutId={id}
        onDragStart={(e) => handleDragStart(e, {title, id, column})}
        draggable="true"
        className="cursor-grab rounded border border-neutral-700 bg-neutral-800 p-3 active:cursor-grabbing"
      >
        <p className="text-sm text-neutral-100">{title}</p>
      </motion.div>
    </>
  );
};

const DropIndicator = ({beforeId, column}) => {
  return (
    <div
      data-before={beforeId || '-1'}
      data-column={column}
      className="w-full h-0.5 my-0.5 bg-violet-400 opacity-0"
    />
  );
};

const BurnBarrel = ({setCards}) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
  };

  const handleDragEnd = (e) => {
    const cardId = e.dataTransfer.getData('cardId');

    setCards((prev) => prev.filter((c) => c.id !== cardId));

    setActive(false);
  };
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDragEnd}
      className={`mt-10 grid h-56 w-56 shrink-0 place-content-center rounded border text-3xl ${
        active ? 'border-red-800 bg-red-800/20 text-red-500' : 'border-neutral-500 bg-neutral-500/20 text-neutral-500'
      }`}
    >
      {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
    </div>
  );
};

const AddCard = ({column, setCards}) => {
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!text.trim().length) return;

    const newCard = {
      column,
      title: text.trim(),
      id: Math.random().toString(),
    };

    setCards((prev) => [...prev, newCard]);
    setAdding(false);
    // setText('');
  };

  return (
    <>
      {adding ? (
        <motion.form layout>
          <textarea
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new task..."
            className="w-full rounded bg-violet-400/20 p-3 text-sm text-neutral-50 placeholder:text-violet-300 focus:outline-none"
          />
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
            >
              close
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 bg-neutral-50 rounded px-3 py-1.5 text-xs text-neutral-950 transition-colors hover:text-neutral-300"
            >
              <span>Add</span>
              <FiPlus />
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
        >
          <span>Add card</span>
          <FiPlus />
        </motion.button>
      )}
    </>
  );
};

const DEFAULT_CARDS = [
  {
    id: '1',
    title: 'Create a new project',
    description: 'Create a new project using the latest version of React',
    column: 'backlog',
  },
  {
    id: '2',
    title: 'Create a new component',
    description: 'Create a new component using the latest version of React',
    column: 'todo',
  },
  {
    id: '3',
    title: 'Create a new feature',
    description: 'Create a new feature using the latest version of React',
    column: 'progress',
  },
  {
    id: '4',
    title: 'Create a new page',
    description: 'Create a new page using the latest version of React',
    column: 'complete',
  },
  {
    id: '5',
    title: 'Create a new page',
    description: 'Create a new page using the latest version of React',
    column: 'backlog',
  },
  {
    id: '6',
    title: 'Create a new page',
    description: 'Create a new page using the latest version of React',
    column: 'todo',
  },
];

export default App;
