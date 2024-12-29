// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((registration) => {
        console.log(
          "ServiceWorker registered successfully:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error("ServiceWorker registration failed:", error);
      });
  });
}

let deferredPrompt;
const installPromptContainer = document.createElement("div");
installPromptContainer.className = "install-prompt";
document.body.appendChild(installPromptContainer);

// Create the prompt content
installPromptContainer.innerHTML = `
  <p class="install-prompt-text">Install Todo App for a better experience!</p>
  <div class="install-prompt-buttons">
    <button class="install-button">Install</button>
    <button class="close-prompt-button">Not Now</button>
  </div>
`;

// Handle the beforeinstallprompt event
window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;

  // Check if it's a mobile device and the app isn't already installed
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    // Show the install prompt after a short delay
    setTimeout(() => {
      installPromptContainer.classList.add("show");
    }, 2000);
  }
});

// Handle install button click
document
  .querySelector(".install-button")
  .addEventListener("click", async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      // Clear the deferredPrompt variable
      deferredPrompt = null;
      // Hide the install prompt
      installPromptContainer.classList.remove("show");
    }
  });

// Handle close button click
document.querySelector(".close-prompt-button").addEventListener("click", () => {
  installPromptContainer.classList.remove("show");
  // Set a flag in localStorage to not show the prompt again for some time
  localStorage.setItem("installPromptDismissed", Date.now());
});

// Check if the app is installed
window.addEventListener("appinstalled", (evt) => {
  console.log("Todo App was installed.");
  installPromptContainer.classList.remove("show");
  // You might want to track this event in your analytics
});

// Function to check if we should show the install prompt
function shouldShowInstallPrompt() {
  const lastDismissed = localStorage.getItem("installPromptDismissed");
  if (!lastDismissed) return true;

  // Show prompt again after 3 days
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  return Date.now() - parseInt(lastDismissed) > threeDays;
}

// Step 1: Select the necessary DOM elements
const todoForm = document.querySelector("form");
const todoInput = document.getElementById("todo-input");
const todoListUl = document.getElementById("todo-list");
const deleteAll = document.getElementById("delete-all");
const todoCount = document.getElementById("todo-count");

// Create wrapper div for search and sort
const filterWrapper = document.createElement("div");
filterWrapper.className = "filter-wrapper";

// Create search input
const searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.id = "search-input";
searchInput.placeholder = "Search todos...";

// Create sort select
const sortSelect = document.createElement("select");
sortSelect.id = "sort-select";
sortSelect.innerHTML = `
  <option value="newest">Newest First</option>
  <option value="oldest">Oldest First</option>
  <option value="alphabetical">Alphabetical</option>
`;

// Add elements to wrapper
filterWrapper.appendChild(searchInput);
filterWrapper.appendChild(sortSelect);

// Insert wrapper after the form
todoForm.after(filterWrapper);

// Step 2: Initialize the todos array by fetching saved todos
let allTodos = getTodos(); // 2.1: Load saved todos from localStorage
updateTodoList(); // 2.2: Update the UI with the loaded todos

// Step 3: Add event listener for form submission
todoForm.addEventListener("submit", function (e) {
  e.preventDefault(); // 3.1: Prevent page reload on form submission
  addTodo(); // 3.2: Call the function to add a new todo
});

// Step 4: Define the function to add a new todo
function addTodo() {
  try {
    const todoText = validateTodoText(todoInput.value.trim());
    const todoObject = {
      id: Date.now(),
      text: todoText,
      completed: false,
      createdAt: new Date().toISOString(),
      description: "",
    };

    allTodos.push(todoObject);
    updateTodoList();
    saveTodos();
    todoInput.value = "";
  } catch (error) {
    alert(error.message);
  }
}

// Add after the addTodo function
function validateTodoText(text) {
  if (text.length === 0) {
    throw new Error("Todo text cannot be empty");
  }
  if (text.length > 100) {
    throw new Error("Todo text must be less than 100 characters");
  }
  return text;
}

// Step 5: Define a function to create a new todo item (HTML structure)
function createTodoItem(todo, todoIndex) {
  // 5.1: Generate unique IDs for the todo item and its associated elements
  const todoId = "todo-" + todoIndex;
  const txtId = "txt-" + todoIndex;

  // 5.2: Create a list item element and assign a class name
  const todoLi = document.createElement("li");
  todoLi.className = "todo";
  todoLi.draggable = true; // Make item draggable
  todoLi.dataset.id = todo.id; // Add ID for tracking

  // Add drag event listeners
  todoLi.addEventListener("dragstart", handleDragStart);
  todoLi.addEventListener("dragend", handleDragEnd);
  todoLi.addEventListener("dragover", handleDragOver);
  todoLi.addEventListener("drop", handleDrop);

  // 5.3: Add the HTML structure for the todo item
  const todoText = todo.text; // Access the text property from the todo object
  todoLi.innerHTML = `
    <input type="checkbox" id="${todoId}" />
    <label class="custom-checkbox" for="${todoId}">
      <svg fill="transparent" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
      </svg>
    </label>
    <div class="todo-content">
    <label id="${txtId}" class="todo-text">${todoText}</label>
      <p class="todo-description ${
        todo.description ? "has-description" : ""
      }">${todo.description || "Add description..."}</p>
    </div>
    <button class="description-button" title="Add/Edit Description">
      <svg fill="var(--secondary-color)" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
        <path d="M319-250h322v-60H319v60Zm0-170h322v-60H319v60Zm-99 340q-24 0-42-18t-18-42v-680q0-24 18-42t42-18h520q24 0 42 18t18 42v680q0 24-18 42t-42 18H220Zm0-60h520v-680H220v680Zm0 0v-680 680Z"/>
      </svg>
    </button>
    <button class="edit-button">
      <svg fill="var(--secondary-color)" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
        <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
      </svg>
    </button>
    <button class="delete-button">
      <svg fill="var(--secondary-color)" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
      </svg>
    </button>
  `;

  // Step 6: Add event listeners for the todo item
  const checkbox = todoLi.querySelector("input");
  checkbox.checked = todo.completed; // 6.1: Set checkbox state based on completion status
  checkbox.addEventListener("change", (e) => {
    // Check if the todo item is in edit mode
    const todoLi = e.target.closest(".todo");
    const isEditing = todoLi.querySelector(".input1");

    if (isEditing) {
      // If in edit mode, prevent the checkbox change and keep focus on input
      e.preventDefault();
      checkbox.checked = !checkbox.checked; // Revert the checkbox state

      // Store the current selection/cursor position
      const start = isEditing.selectionStart;
      const end = isEditing.selectionEnd;

      // Restore focus and selection after a small delay
      setTimeout(() => {
        isEditing.focus();
        isEditing.setSelectionRange(start, end);
      }, 0);
      return;
    }

    // Update the todo's completed status
    allTodos[todoIndex].completed = checkbox.checked;
    todoLi.classList.toggle("completed", checkbox.checked);
    saveTodos();

    // If we're currently filtering/searching, we need to update the filtered view
    if (searchInput.value) {
      filterTodos(searchInput.value);
    } else {
      updateTodoList();
    }
  });

  const deleteButton = todoLi.querySelector(".delete-button");
  deleteButton.addEventListener("click", () => deleteTodoItem(todoIndex)); // 6.4: Add event listener for delete button

  const editButton = todoLi.querySelector(".edit-button");
  editButton.addEventListener("click", () => onClick(todoIndex)); // 6.5: Add event listener for edit button

  const descButton = todoLi.querySelector(".description-button");
  descButton.addEventListener("click", () => editDescription(todoIndex));

  return todoLi; // 6.6: Return the created list item
}

// Step 7: Define a function to update the todo list UI
function updateTodoList() {
  renderTodos(allTodos);
}

// Step 8: Define a function to delete a todo item
function deleteTodoItem(todoIndex) {
  const todoId = allTodos[todoIndex].id; // Get the ID before deletion
  allTodos = allTodos.filter((todo) => todo.id !== allTodos[todoIndex].id);
  saveTodos();

  // If we're currently filtering/searching, we need to update the filtered view
  if (searchInput.value) {
    filterTodos(searchInput.value);
  } else {
    updateTodoList();
  }
}

// Step 9: Define a function to edit a todo item
function onClick(todoIndex) {
  const todoItem = document.getElementById(`txt-${todoIndex}`);
  const existingText = allTodos[todoIndex].text;
  const todoLi = todoItem.closest(".todo");

  // Keep the checkbox and its label
  const checkbox = todoLi.querySelector('input[type="checkbox"]');
  const customCheckbox = todoLi.querySelector(".custom-checkbox");

  // Create the new vertical div for input and buttons
  const verticalDiv = document.createElement("div");
  verticalDiv.style.display = "flex";
  verticalDiv.style.flexDirection = "column";
  verticalDiv.style.flex = "1";
  verticalDiv.style.gap = "8px";

  // Create text input
  const input1 = document.createElement("input");
  input1.type = "text";
  input1.className = "input1";
  input1.id = `input1-${todoIndex}`;
  input1.value = existingText;

  // Create horizontal button container
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container";

  // Create submit button
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "button1";
  submitButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="#E8EAED">
      <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
    </svg>
  `;

  // Add existing action buttons
  const descButton = todoLi
    .querySelector(".description-button")
    .cloneNode(true);
  const editButton = todoLi.querySelector(".edit-button").cloneNode(true);
  const deleteButton = todoLi.querySelector(".delete-button").cloneNode(true);

  // Clear and rebuild todo item
  todoLi.innerHTML = "";
  todoLi.appendChild(checkbox);
  todoLi.appendChild(customCheckbox);
  todoLi.appendChild(verticalDiv);

  // Assemble the structure
  buttonContainer.appendChild(submitButton);
  buttonContainer.appendChild(descButton);
  buttonContainer.appendChild(editButton);
  buttonContainer.appendChild(deleteButton);

  verticalDiv.appendChild(input1);
  verticalDiv.appendChild(buttonContainer);

  // Add form functionality
  const handleSubmit = (e) => {
    e && e.preventDefault();
    const updatedText = input1.value.trim();
    if (updatedText) {
      allTodos[todoIndex].text = updatedText;
      saveTodos();
      updateTodoList();
    }
  };

  // Add event listeners
  submitButton.addEventListener("click", handleSubmit);
  input1.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  });

  // Focus the input
  input1.focus();

  // Add click outside handler
  const handleClickOutside = (e) => {
    if (!todoLi.contains(e.target)) {
      e.preventDefault();
      input1.focus();
    }
  };

  // Add the event listener
  document.addEventListener("click", handleClickOutside);

  // Remove the event listener when the todo is updated
  const cleanup = () => {
    document.removeEventListener("click", handleClickOutside);
  };

  // Update event listeners to clean up
  submitButton.addEventListener("click", cleanup);
  input1.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      cleanup();
    }
  });
}

// Step 10: Add an event listener for clearing all todos
deleteAll.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.clear(); // 11.1: Clear localStorage
  allTodos = []; // 11.2: Reset the todos array
  updateTodoList(); // 11.3: Update the UI
});

// Step 11: Define a function to save todos to localStorage
function saveTodos() {
  try {
    console.log("Saving todos:", allTodos);
    const todosJson = JSON.stringify(allTodos);
    localStorage.setItem("todos", todosJson);
    const savedTodos = localStorage.getItem("todos");
    console.log("Saved todos:", JSON.parse(savedTodos));
  } catch (error) {
    console.error("Failed to save todos:", error);
    alert("Failed to save todos. Storage might be full.");
  }
}

// Step 12: Define a function to load todos from localStorage
function getTodos() {
  try {
    const todos = localStorage.getItem("todos");
    console.log("Loading todos:", todos ? JSON.parse(todos) : []);
    return todos ? JSON.parse(todos) : [];
  } catch (error) {
    console.error("Failed to load todos:", error);
    return [];
  }
}

// Add the search function
function filterTodos(searchText) {
  const filteredTodos = allTodos.filter((todo) =>
    todo.text.toLowerCase().includes(searchText.toLowerCase())
  );
  renderTodos(filteredTodos);
}

// Add event listener
searchInput.addEventListener("input", (e) => filterTodos(e.target.value));

// Modify updateTodoList to use a renderTodos function
function renderTodos(todos) {
  todoListUl.innerHTML = "";

  // Always sort completed items to bottom regardless of other sorting
  const sortedTodos = sortTodos(todos, sortSelect.value);

  let hasCompletedTasks = false;
  let currentIndex = 0; // Keep track of the actual index in allTodos

  sortedTodos.forEach((todo) => {
    // Find the actual index in allTodos array
    const todoIndex = allTodos.findIndex((t) => t.id === todo.id);
    const todoItem = createTodoItem(todo, todoIndex);

    if (todo.completed && !hasCompletedTasks) {
      const separator = document.createElement("div");
      separator.className = "completed-separator";
      separator.innerHTML = "<hr><span>Completed Tasks</span><hr>";
      todoListUl.append(separator);
      hasCompletedTasks = true;
    }

    todoListUl.append(todoItem);
    currentIndex++;
  });

  todoCount.textContent = todos.length;
}

// Add sorting function
function sortTodos(todos, sortBy) {
  const sortedTodos = [...todos];
  switch (sortBy) {
    case "newest":
      return sortedTodos
        .sort((a, b) => b.id - a.id)
        .sort((a, b) => Number(a.completed) - Number(b.completed));
    case "oldest":
      return sortedTodos
        .sort((a, b) => a.id - b.id)
        .sort((a, b) => Number(a.completed) - Number(b.completed));
    case "alphabetical":
      return sortedTodos
        .sort((a, b) => a.text.localeCompare(b.text))
        .sort((a, b) => Number(a.completed) - Number(b.completed));
    case "completed":
      return sortedTodos.sort(
        (a, b) => Number(a.completed) - Number(b.completed)
      );
    default:
      return sortedTodos.sort(
        (a, b) => Number(a.completed) - Number(b.completed)
      );
  }
}

// Add event listener
sortSelect.addEventListener("change", (e) => {
  const sortedTodos = sortTodos(allTodos, e.target.value);
  renderTodos(sortedTodos);
});

// Add drag and drop handler functions
function handleDragStart(e) {
  e.target.classList.add("dragging");
  e.dataTransfer.setData("text/plain", e.target.dataset.id);
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");
}

function handleDragOver(e) {
  e.preventDefault();
  const draggingItem = document.querySelector(".dragging");
  const siblings = [...todoListUl.querySelectorAll(".todo:not(.dragging)")];

  // Get the dragged todo's completion status
  const draggedId = draggingItem.dataset.id;
  const draggedTodo = allTodos.find((t) => t.id.toString() === draggedId);

  // Filter siblings to only those with matching completion status
  const validSiblings = siblings.filter((sibling) => {
    const siblingId = sibling.dataset.id;
    const siblingTodo = allTodos.find((t) => t.id.toString() === siblingId);
    return siblingTodo.completed === draggedTodo.completed;
  });

  const nextSibling = validSiblings.find((sibling) => {
    const box = sibling.getBoundingClientRect();
    const offset = e.clientY - box.top - box.height / 2;
    return offset < 0;
  });

  if (nextSibling) {
    todoListUl.insertBefore(draggingItem, nextSibling);
  } else if (validSiblings.length > 0) {
    // Only append to the last valid sibling
    todoListUl.insertBefore(
      draggingItem,
      validSiblings[validSiblings.length - 1].nextSibling
    );
  }
}

function handleDrop(e) {
  e.preventDefault();
  const draggedId = e.dataTransfer.getData("text/plain");
  const droppedId = e.target.closest(".todo").dataset.id;

  if (draggedId !== droppedId) {
    const draggedTodo = allTodos.find((t) => t.id.toString() === draggedId);
    const droppedTodo = allTodos.find((t) => t.id.toString() === droppedId);

    // If trying to mix completed and incomplete tasks, don't allow the drop
    if (draggedTodo.completed !== droppedTodo.completed) {
      // Add shake animation to indicate invalid move
      const draggedElement = document.querySelector(`[data-id="${draggedId}"]`);
      draggedElement.classList.add("todo-error");
      setTimeout(() => {
        draggedElement.classList.remove("todo-error");
      }, 500);
      return;
    }

    // Proceed with the reordering if both tasks have the same completion status
    const newTodos = [...allTodos];
    const draggedIndex = newTodos.findIndex(
      (t) => t.id.toString() === draggedId
    );
    const droppedIndex = newTodos.findIndex(
      (t) => t.id.toString() === droppedId
    );

    const [draggedItem] = newTodos.splice(draggedIndex, 1);
    newTodos.splice(droppedIndex, 0, draggedItem);

    allTodos = newTodos;
    saveTodos();
    updateTodoList(); // Refresh the list to maintain proper order
  }
}

// Add description edit function
function editDescription(todoIndex) {
  const todoLi = document.getElementById(`txt-${todoIndex}`).closest(".todo");
  const descriptionP = todoLi.querySelector(".todo-description");
  const descButton = todoLi.querySelector(".description-button");

  // If we're already editing, return early - we'll handle this via the click handler
  const existingInput = todoLi.querySelector(".description-input");
  if (existingInput) {
    return;
  }

  // Original description editing logic continues here...
  const currentDesc = allTodos[todoIndex].description || "";
  descriptionP.style.display = "none";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "description-input";
  input.value = currentDesc;
  input.placeholder = "Add a description...";

  // Insert input after the description paragraph
  descriptionP.parentNode.insertBefore(input, descriptionP.nextSibling);
  input.focus();

  // Store the original click handler
  const originalClickHandler = descButton.onclick;
  // Remove the original click handler temporarily
  descButton.onclick = null;

  // Flag to track if submission has occurred
  let isSubmitted = false;

  const handleSubmit = (e) => {
    // Prevent default behavior and stop propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Prevent multiple submissions
    if (isSubmitted) return;
    isSubmitted = true;

    const newDescription = input.value.trim();
    allTodos[todoIndex].description = newDescription || "";

    // Debug logs
    console.log("Updating description for todo:", todoIndex);
    console.log("New description:", newDescription);
    console.log("Updated todo:", allTodos[todoIndex]);

    saveTodos();

    // Update UI
    descriptionP.textContent = newDescription || "Add description...";
    descriptionP.classList.toggle("has-description", Boolean(newDescription));
    descriptionP.style.display = "";

    // Remove input element
    if (input && input.parentNode) {
      input.parentNode.removeChild(input);
    }

    // Cleanup event listeners
    descButton.removeEventListener("click", handleButtonClick);
    input.removeEventListener("keydown", handleKeyDown);
    input.removeEventListener("blur", handleBlur);

    // Remove focus from the todo item
    todoLi.blur();
    // Also try to remove focus from any focusable elements within the todo item
    const focusableElements = todoLi.querySelectorAll(
      "button, input, [tabindex]"
    );
    focusableElements.forEach((element) => element.blur());

    // Restore original click handler
    setTimeout(() => {
      descButton.onclick = originalClickHandler;
    }, 0);
  };

  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(e);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleBlur = (e) => {
    // Small delay to allow button click to process first
    setTimeout(() => {
      if (!isSubmitted) {
        handleSubmit(e);
      }
    }, 100);
  };

  // Add event listeners
  descButton.addEventListener("click", handleButtonClick);
  input.addEventListener("keydown", handleKeyDown);
  input.addEventListener("blur", handleBlur);
}
