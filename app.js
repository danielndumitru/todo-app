// List Management Variables and Functions
let currentListId = "default";
let todoLists = loadTodoLists();
let allTodos = getTodos(); // Single declaration of allTodos
let lastSelectedListId = localStorage.getItem("lastSelectedList") || "default";
currentListId = lastSelectedListId; // Update initial currentListId

// DOM Elements
const todoForm = document.querySelector("#todo-form");
const todoInput = document.getElementById("todo-input");
const todoListUl = document.getElementById("todo-list");
const deleteAll = document.getElementById("delete-all");
const todoCount = document.getElementById("todo-count");
const versionDisplay = document.querySelector(".version-display");
const helpButton = document.querySelector(".help-button");
const helpWindow = document.querySelector(".help-window");
const closeHelp = document.querySelector(".close-help");

// Create wrapper div for search and sort
const filterWrapper = document.createElement("div");
filterWrapper.className = "filter-wrapper";

// Create sort select first
const sortSelect = document.createElement("select");
sortSelect.id = "sort-select";
sortSelect.innerHTML = `
  <option value="newest">New</option>
  <option value="oldest">Old</option>
  <option value="alphabetical">A-Z</option>
`;

// Create search elements
const searchIcon = document.createElement("button");
searchIcon.className = "search-icon";
searchIcon.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
    <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
  </svg>
`;

const searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.id = "search-input";
searchInput.className = "search-input";
searchInput.placeholder = "Search todos...";

// Insert elements into form container
const formContainer = document.querySelector(".form-container");
formContainer.appendChild(sortSelect);
formContainer.appendChild(searchIcon);
formContainer.appendChild(searchInput);

// List Management Functions
function loadTodoLists() {
  const lists = localStorage.getItem("todoLists");
  return lists
    ? JSON.parse(lists)
    : {
        default: {
          name: "My Lists", // Change default list name
          todos: [],
          id: "default",
        },
      };
}

function saveTodoLists() {
  localStorage.setItem("todoLists", JSON.stringify(todoLists));
}

function getTodos() {
  const currentList = todoLists[currentListId];
  return currentList?.todos || [];
}

// Register the service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => {
        console.log("Service Worker registered successfully");
        updateVersionDisplay(); // Call the function to update the version display
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}

// 1. PWA Installation Management
let deferredPrompt = null; // Store the beforeinstallprompt event
const installPromptContainer = document.createElement("div");
installPromptContainer.className = "install-prompt";
document.body.appendChild(installPromptContainer);

// 2. Create install prompt content
installPromptContainer.innerHTML = `
  <p class="install-prompt-text">Install Todo App for a better experience!</p>
  <div class="install-prompt-buttons">
    <button class="install-button">Install</button>
    <button class="close-prompt-button">Not Now</button>
  </div>
`;

// 3. Handle beforeinstallprompt event
window.addEventListener("beforeinstallprompt", (event) => {
  // Store event for later use
  deferredPrompt = event;

  // Only show prompt if:
  // - User hasn't dismissed it recently
  // - User is on mobile device
  // - App isn't already installed
  if (shouldShowInstallPrompt() && isMobileDevice()) {
    installPromptContainer.classList.add("show");
  }
});

// 4. Handle install button click
document
  .querySelector(".install-button")
  .addEventListener("click", async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      const result = await deferredPrompt.prompt();
      console.log(`Install prompt result: ${result.outcome}`);

      // Clear the deferredPrompt
      deferredPrompt = null;

      // Hide the install prompt
      installPromptContainer.classList.remove("show");

      // Save dismissal timestamp
      localStorage.setItem("installPromptDismissed", Date.now().toString());
    } catch (error) {
      console.error("Install prompt error:", error);
    }
  });

// 5. Handle "Not Now" button click
document.querySelector(".close-prompt-button").addEventListener("click", () => {
  installPromptContainer.classList.remove("show");
  localStorage.setItem("installPromptDismissed", Date.now().toString());
});

// 6. Helper Functions
function shouldShowInstallPrompt() {
  const lastDismissed = localStorage.getItem("installPromptDismissed");
  if (!lastDismissed) return true;

  // Show prompt again after 3 days
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  return Date.now() - parseInt(lastDismissed) > threeDays;
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

// 7. Handle successful installation
window.addEventListener("appinstalled", (event) => {
  console.log("Todo App was installed successfully");
  installPromptContainer.classList.remove("show");
  deferredPrompt = null;
});

// Todo Management Functions
function addTodo() {
  try {
    const todoText = validateTodoText(todoInput.value.trim());
    const todoObject = {
      id: Date.now(),
      text: todoText,
      completed: false,
      createdAt: new Date().toISOString(),
      description: "",
      listId: currentListId,
    };

    todoLists[currentListId].todos.push(todoObject);
    saveTodoLists();
    updateTodoList();
    todoInput.value = "";
  } catch (error) {
    alert(error.message);
  }
}

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
  const checkboxId = `checkbox-${todoIndex}`;

  const todoLi = document.createElement("li");
  todoLi.className = "todo";
  todoLi.draggable = true;
  todoLi.dataset.id = todo.id;

  // Add drag event listeners
  todoLi.addEventListener("dragstart", handleDragStart);
  todoLi.addEventListener("dragend", handleDragEnd);
  todoLi.addEventListener("dragover", handleDragOver);
  todoLi.addEventListener("drop", handleDrop);

  todoLi.innerHTML = `
    <div class="todo-checkbox-wrapper">
      <input type="checkbox" id="${checkboxId}" ${
    todo.completed ? "checked" : ""
  } />
      <label class="custom-checkbox" for="${checkboxId}">
        <svg fill="transparent" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
          <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
        </svg>
      </label>
    </div>
    <div class="todo-content">
      <label for="${checkboxId}" class="todo-text">${todo.text}</label>
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

    // Find the todo by ID instead of using index
    const todoToUpdate = todoLists[currentListId].todos.find(
      (t) => t.id === todo.id
    );
    if (todoToUpdate) {
      todoToUpdate.completed = checkbox.checked;
      todoLi.classList.toggle("completed", checkbox.checked);
      saveTodoLists(); // Save directly to todoLists

      // If we're currently filtering/searching, we need to update the filtered view
      if (searchInput.value) {
        filterTodos(searchInput.value);
      } else {
        updateTodoList();
      }
    }
  });

  const deleteButton = todoLi.querySelector(".delete-button");
  deleteButton.addEventListener("click", () => {
    const index = todoLists[currentListId].todos.findIndex(
      (t) => t.id === todo.id
    );
    if (index !== -1) {
      todoLists[currentListId].todos.splice(index, 1);
      saveTodoLists();
      updateTodoList();
    }
  });

  const editButton = todoLi.querySelector(".edit-button");
  editButton.addEventListener("click", () => {
    const index = todoLists[currentListId].todos.findIndex(
      (t) => t.id === todo.id
    );
    if (index !== -1) {
      onClick(index);
    }
  });

  const descButton = todoLi.querySelector(".description-button");
  descButton.addEventListener("click", () => {
    const index = todoLists[currentListId].todos.findIndex(
      (t) => t.id === todo.id
    );
    if (index !== -1) {
      editDescription(index);
    }
  });

  return todoLi; // 6.6: Return the created list item
}

// Step 7: Define a function to update the todo list UI
function updateTodoList() {
  todoListUl.innerHTML = "";

  // Get todos for current list only
  const currentTodos = todoLists[currentListId]?.todos || [];

  // Update todo count
  todoCount.textContent = currentTodos.length;

  // Filter todos based on search
  const searchTerm = searchInput.value.toLowerCase();
  let filteredTodos = currentTodos.filter((todo) =>
    todo.text.toLowerCase().includes(searchTerm)
  );

  // Sort todos
  const sortValue = sortSelect.value;
  filteredTodos.sort((a, b) => {
    switch (sortValue) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "alphabetical":
        return a.text.localeCompare(b.text);
      default:
        return 0;
    }
  });

  // Group todos by completion status
  const incompleteTodos = filteredTodos.filter((todo) => !todo.completed);
  const completedTodos = filteredTodos.filter((todo) => todo.completed);

  // Add incomplete todos first
  incompleteTodos.forEach((todo, index) => {
    todoListUl.appendChild(createTodoItem(todo, index));
  });

  // Add completed todos
  completedTodos.forEach((todo, index) => {
    todoListUl.appendChild(
      createTodoItem(todo, index + incompleteTodos.length)
    );
  });
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
  const todos = todoLists[currentListId].todos;
  const todo = todos[todoIndex];

  if (!todo) {
    console.error("Todo not found:", todoIndex);
    return;
  }

  const todoLi = document.querySelector(`.todo[data-id="${todo.id}"]`);
  const todoItem = todoLi.querySelector(".todo-text");
  const existingText = todo.text;

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
      todo.text = updatedText; // Update the specific todo
      saveTodoLists(); // Save using the list system
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
  if (confirm("Are you sure you want to delete all todos in this list?")) {
    todoLists[currentListId].todos = [];
    saveTodoLists();
    updateTodoList();
  }
});

// Add sorting function
function sortTodos(todos, sortBy) {
  const sortedTodos = [...todos];
  switch (sortBy) {
    case "newest":
      return sortedTodos.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    case "oldest":
      return sortedTodos.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    case "alphabetical":
      return sortedTodos.sort((a, b) => a.text.localeCompare(b.text));
    default:
      return sortedTodos;
  }
}

// Add event listener
sortSelect.addEventListener("change", updateTodoList);

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
  // Use the current list's todos instead of allTodos
  const currentTodos = todoLists[currentListId].todos;
  const draggedTodo = currentTodos.find((t) => t.id.toString() === draggedId);

  // Filter siblings to only those with matching completion status
  const validSiblings = siblings.filter((sibling) => {
    const siblingId = sibling.dataset.id;
    const siblingTodo = currentTodos.find((t) => t.id.toString() === siblingId);
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
    const currentTodos = todoLists[currentListId].todos;
    const draggedTodo = currentTodos.find((t) => t.id.toString() === draggedId);
    const droppedTodo = currentTodos.find((t) => t.id.toString() === droppedId);

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
    const newTodos = [...currentTodos];
    const draggedIndex = newTodos.findIndex(
      (t) => t.id.toString() === draggedId
    );
    const droppedIndex = newTodos.findIndex(
      (t) => t.id.toString() === droppedId
    );

    const [draggedItem] = newTodos.splice(draggedIndex, 1);
    newTodos.splice(droppedIndex, 0, draggedItem);

    // Update the current list's todos
    todoLists[currentListId].todos = newTodos;
    saveTodoLists();
    updateTodoList();
  }
}

// Add description edit function
function editDescription(todoIndex) {
  const todos = todoLists[currentListId].todos;
  const todo = todos[todoIndex];

  if (!todo) {
    console.error("Todo not found:", todoIndex);
    return;
  }

  const todoLi = document.querySelector(`.todo[data-id="${todo.id}"]`);
  const descriptionP = todoLi.querySelector(".todo-description");
  const descButton = todoLi.querySelector(".description-button");

  // If we're already editing, return early - we'll handle this via the click handler
  const existingInput = todoLi.querySelector(".description-input");
  if (existingInput) {
    return;
  }

  // Original description editing logic continues here...
  const currentDesc = todo.description || "";
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
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isSubmitted) return;
    isSubmitted = true;

    const newDescription = input.value.trim();
    todo.description = newDescription || ""; // Update the specific todo
    saveTodoLists(); // Save using the list system

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

// Handle push notifications
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  if (Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Notification permission granted");
      }
    });
  }
}

// Call when app initializes
document.addEventListener("DOMContentLoaded", requestNotificationPermission);

// Handle app updates
let updateAvailable = false;

navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data.type === "UPDATE_AVAILABLE") {
    updateAvailable = true;
    showUpdatePrompt(event.data.version);
  }
});

function showUpdatePrompt(newVersion) {
  const updatePrompt = document.createElement("div");
  updatePrompt.className = "update-prompt show";
  updatePrompt.innerHTML = `
    <p class="update-prompt-text">A new version (${newVersion}) is available!</p>
    <div class="update-prompt-buttons">
      <button class="update-button">Update Now</button>
      <button class="update-later-button">Later</button>
    </div>
  `;

  document.body.appendChild(updatePrompt);

  updatePrompt
    .querySelector(".update-button")
    .addEventListener("click", async () => {
      try {
        updatePrompt.querySelector(".update-prompt-text").textContent =
          "Updating...";
        updatePrompt.querySelector(".update-prompt-buttons").style.display =
          "none";

        // Clear all caches
        await caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        });

        // Force service worker update
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage("FORCE_UPDATE");
        }

        // Wait for the new service worker to take control
        navigator.serviceWorker.ready.then(() => {
          // Update the version after the update is confirmed
          localStorage.setItem("appVersion", newVersion); // Store the new version in localStorage
          displayVersion(); // Update the displayed version
          updatePrompt.remove(); // Remove the update prompt
        });
      } catch (error) {
        console.error("Update failed:", error);
        alert("Update failed. Please try again.");
      }
    });

  updatePrompt
    .querySelector(".update-later-button")
    .addEventListener("click", () => {
      updatePrompt.remove(); // Just remove the prompt without updating the version
    });
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// List Operations
function createNewList(name) {
  const id = "list_" + Date.now();
  todoLists[id] = {
    name: name,
    todos: [],
    id: id,
  };
  saveTodoLists();
  localStorage.setItem("lastSelectedList", id); // Save as last selected list
  updateListSelect();
  switchList(id);
}

function updateListSelect() {
  const select = document.getElementById("list-select");
  select.innerHTML = "";

  // Sort lists by creation date (most recent first)
  const sortedLists = Object.entries(todoLists).sort(([idA, a], [idB, b]) => {
    const aId = parseInt(a.id.split("_")[1] || 0);
    const bId = parseInt(b.id.split("_")[1] || 0);
    return bId - aId;
  });

  sortedLists.forEach(([id, list]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = list.name;
    option.selected = id === currentListId;
    select.appendChild(option);
  });
}

function switchList(listId) {
  if (todoLists[listId]) {
    currentListId = listId;
    localStorage.setItem("lastSelectedList", listId); // Save last selected list
    allTodos = [...todoLists[listId].todos];
    updateTodoList();
  } else {
    console.error("List not found:", listId);
  }
}

function deleteCurrentList() {
  if (currentListId === "default") {
    alert("Cannot delete the default list");
    return;
  }

  if (
    confirm(
      `Are you sure you want to delete "${todoLists[currentListId].name}"?`
    )
  ) {
    delete todoLists[currentListId];
    saveTodoLists();

    // Find the most recently created list (excluding the one being deleted)
    const remainingLists = Object.entries(todoLists)
      .filter(([id]) => id !== currentListId)
      .sort(([, a], [, b]) => {
        const aId = parseInt(a.id.split("_")[1] || 0);
        const bId = parseInt(b.id.split("_")[1] || 0);
        return bId - aId;
      });

    // Switch to the most recent list or default
    const nextListId = remainingLists[0]?.[0] || "default";
    currentListId = nextListId;
    localStorage.setItem("lastSelectedList", nextListId);
    allTodos = [...todoLists[nextListId].todos];
    updateListSelect();
    updateTodoList();
  }
}

function editCurrentList(newName) {
  if (!newName.trim()) {
    alert("List name cannot be empty");
    return;
  }

  const nameExists = Object.values(todoLists).some(
    (list) => list.name === newName && list !== todoLists[currentListId]
  );

  if (nameExists) {
    alert("A list with this name already exists");
    return;
  }

  todoLists[currentListId].name = newName;
  saveTodoLists();
  updateListSelect();
}

// Modal functionality for list operations
function showListModal(title, initialValue, onSave) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close">&times;</button>
      </div>
      <input type="text" class="modal-input" placeholder="List name" value="${initialValue}" maxlength="30">
      <div class="modal-buttons">
        <button class="modal-button secondary">Cancel</button>
        <button class="modal-button primary">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("show"));

  const input = modal.querySelector(".modal-input");
  input.focus();
  input.select(); // Select existing text when editing

  function closeModal() {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 300);
  }

  function handleSave() {
    const name = input.value.trim();
    if (name) {
      onSave(name);
      closeModal();
    } else {
      alert("Please enter a list name");
      input.focus();
    }
  }

  modal.querySelector(".modal-close").onclick = closeModal;
  modal.querySelector(".modal-button.secondary").onclick = closeModal;
  modal.querySelector(".modal-button.primary").onclick = handleSave;

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Handle Enter and Escape keys
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      closeModal();
    }
  });

  // Prevent closing when clicking modal content
  modal.querySelector(".modal-content").addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

// Event Listeners
todoForm.addEventListener("submit", function (e) {
  e.preventDefault();
  addTodo();
});

document.getElementById("list-select").addEventListener("change", (e) => {
  switchList(e.target.value);
});

document.getElementById("new-list-button").addEventListener("click", () => {
  showListModal("Create New List", "", (name) => createNewList(name));
});

document.getElementById("edit-list-button").addEventListener("click", () => {
  showListModal("Edit List", todoLists[currentListId].name, (name) =>
    editCurrentList(name)
  );
});

document
  .getElementById("delete-list-button")
  .addEventListener("click", deleteCurrentList);

searchInput.addEventListener("input", updateTodoList);
sortSelect.addEventListener("change", updateTodoList);

// Initialize
updateListSelect();
updateTodoList();

// Add this function to fetch and update the version
let currentVersion = localStorage.getItem("appVersion") || "1.0.0"; // Default version if not set

// Function to display the current version
function displayVersion() {
  const versionDisplay = document.querySelector(".version-display");
  versionDisplay.textContent = "v" + currentVersion; // Display the version from localStorage
}

function updateVersionDisplay() {
  fetch("./version.json?nocache=" + new Date().getTime(), {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      // Check if the current version is different from the fetched version
      if (currentVersion && currentVersion !== data.version) {
        newVersion = data.version; // Store the new version temporarily
        handleAppUpdate(newVersion); // Notify the user about the update
      }
      // Update the current version variable
      currentVersion = data.version;
      localStorage.setItem("appVersion", currentVersion); // Store the current version in localStorage
      displayVersion(); // Update the displayed version
    })
    .catch((error) => console.error("Error fetching version:", error));
}

// Update the app update handler
function handleAppUpdate(version) {
  const updatePrompt = document.createElement("div");
  updatePrompt.className = "update-prompt show";
  updatePrompt.innerHTML = `
    <p class="update-prompt-text">A new version (${version}) is available!</p>
    <div class="update-prompt-buttons">
      <button class="update-button">Update Now</button>
      <button class="update-later-button">Later</button>
    </div>
  `;

  document.body.appendChild(updatePrompt);

  updatePrompt
    .querySelector(".update-button")
    .addEventListener("click", async () => {
      try {
        updatePrompt.querySelector(".update-prompt-text").textContent =
          "Updating...";
        updatePrompt.querySelector(".update-prompt-buttons").style.display =
          "none";

        // Clear all caches
        await caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        });

        // Force service worker update
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage("FORCE_UPDATE");
        }

        // Wait for the new service worker to take control
        navigator.serviceWorker.ready.then(() => {
          // Update the version after the update is confirmed
          localStorage.setItem("appVersion", version); // Store the new version in localStorage
          displayVersion(); // Update the displayed version
          updatePrompt.remove(); // Remove the update prompt
        });
      } catch (error) {
        console.error("Update failed:", error);
        alert("Update failed. Please try again.");
      }
    });

  updatePrompt
    .querySelector(".update-later-button")
    .addEventListener("click", () => {
      updatePrompt.remove(); // Just remove the prompt without updating the version
    });
}

// Listen for messages from the service worker
navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data.type === "UPDATE_AVAILABLE") {
    handleAppUpdate(event.data.version);
  }
});

// Display the current version on load
displayVersion();

// Add help window functionality
helpButton.addEventListener("click", () => {
  helpWindow.classList.add("show");
});

closeHelp.addEventListener("click", () => {
  helpWindow.classList.remove("show");
});

// Close help window when clicking outside
document.addEventListener("click", (e) => {
  if (
    helpWindow.classList.contains("show") &&
    !helpWindow.contains(e.target) &&
    e.target !== helpButton
  ) {
    helpWindow.classList.remove("show");
  }
});

// Close help window on escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && helpWindow.classList.contains("show")) {
    helpWindow.classList.remove("show");
  }
});

// Update click handler for search icon
searchIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  formContainer.classList.toggle("active");
  searchInput.classList.toggle("active");
  todoForm.classList.toggle("invisible");
  sortSelect.classList.toggle("invisible");

  if (searchInput.classList.contains("active")) {
    searchInput.focus();
  }
});

// Update blur handler to hide search when clicking outside
document.addEventListener("click", (e) => {
  const isClickOutside =
    !searchIcon.contains(e.target) && !searchInput.contains(e.target);

  if (isClickOutside) {
    formContainer.classList.remove("active");
    searchInput.classList.remove("active");
    todoForm.classList.remove("invisible");
    sortSelect.classList.remove("invisible");
  }
});

// Update input focus handler
searchInput.addEventListener("focus", () => {
  formContainer.classList.add("active");
  searchInput.classList.add("active");
  todoForm.classList.add("invisible");
  sortSelect.classList.add("invisible");
});

// Add hamburger menu functionality
const hamburgerButton = document.querySelector(".hamburger-button");
const hamburgerMenu = document.querySelector(".hamburger-menu");

hamburgerButton.addEventListener("click", (e) => {
  e.stopPropagation();
  hamburgerMenu.classList.toggle("active");
  hamburgerButton.classList.toggle("active");
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!hamburgerMenu.contains(e.target)) {
    hamburgerMenu.classList.remove("active");
    hamburgerButton.classList.remove("active");
  }
});

// Move the list control buttons to the hamburger menu
const listButtons = document.querySelectorAll(".menu-item");
listButtons.forEach((button) => {
  button.addEventListener("click", () => {
    hamburgerMenu.classList.remove("active");
    hamburgerButton.classList.remove("active");
  });
});

// Initialize the app version on load
document.addEventListener("DOMContentLoaded", () => {
  currentVersion = localStorage.getItem("appVersion") || "1.0.0"; // Default version if not set
  displayVersion(); // Display the current version
});
