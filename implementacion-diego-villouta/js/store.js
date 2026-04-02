// Mock de Firebase Firestore usando LocalStorage para cumplir con la ejecución local
// tal como indica el Requerimiento 6 (sin necesidad de configuración previa de llaves)

const store = {
    _getData: (collection) => {
        const data = localStorage.getItem('reserva_app_' + collection);
        return data ? JSON.parse(data) : [];
    },
    
    _saveData: (collection, data) => {
        localStorage.setItem('reserva_app_' + collection, JSON.stringify(data));
    },

    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // --- CLIENTS ---
    getClients: async () => store._getData('clients'),
    saveClient: async (client) => {
        const clients = store._getData('clients');
        if (client.id) {
            const index = clients.findIndex(c => c.id === client.id);
            if (index !== -1) clients[index] = client;
        } else {
            client.id = store.generateId();
            clients.push(client);
        }
        store._saveData('clients', clients);
        return client;
    },
    deleteClient: async (id) => {
        const clients = store._getData('clients').filter(c => c.id !== id);
        store._saveData('clients', clients);
    },

    // --- CATEGORIES ---
    getCategories: async () => store._getData('categories'),
    saveCategory: async (category) => {
        const categories = store._getData('categories');
        if (category.id) {
            const index = categories.findIndex(c => c.id === category.id);
            if (index !== -1) categories[index] = category;
        } else {
            category.id = store.generateId();
            categories.push(category);
        }
        store._saveData('categories', categories);
        return category;
    },
    deleteCategory: async (id) => {
        const categories = store._getData('categories').filter(c => c.id !== id);
        store._saveData('categories', categories);
    },

    // --- TECHNICIANS ---
    getTechnicians: async () => store._getData('technicians'),
    saveTechnician: async (technician) => {
        const technicians = store._getData('technicians');
        if (technician.id) {
            const index = technicians.findIndex(t => t.id === technician.id);
            if (index !== -1) technicians[index] = technician;
        } else {
            technician.id = store.generateId();
            technicians.push(technician);
        }
        store._saveData('technicians', technicians);
        return technician;
    },
    deleteTechnician: async (id) => {
        const technicians = store._getData('technicians').filter(t => t.id !== id);
        store._saveData('technicians', technicians);
    },

    // --- RESERVATIONS ---
    getReservations: async () => store._getData('reservations'),
    saveReservation: async (reservation) => {
        const reservations = store._getData('reservations');
        if (reservation.id) {
            const index = reservations.findIndex(r => r.id === reservation.id);
            if (index !== -1) reservations[index] = reservation;
        } else {
            reservation.id = store.generateId();
            reservations.push(reservation);
        }
        store._saveData('reservations', reservations);
        return reservation;
    },
    // Nota: Las reservas no se eliminan según los requerimientos, solo se cancelan.
};

window.db = store;
