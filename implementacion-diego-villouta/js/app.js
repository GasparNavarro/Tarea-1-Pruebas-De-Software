// Main application logic

class App {
    constructor() {
        this.data = {
            clients: [],
            technicians: [],
            categories: [],
            reservations: []
        };
        
        // UI filter elements
        this.filters = {
            client: document.getElementById('filter-client'),
            technician: document.getElementById('filter-technician'),
            status: document.getElementById('filter-status'),
            sort: document.getElementById('sort-reservations')
        };
        
        this.init();
    }

    async init() {
        this.setupNavigation();
        this.setupFilters();
        await this.loadAllData();
        
        // Render initial view
        this.renderAll();
    }

    setupNavigation() {
        const tabs = document.querySelectorAll('.nav-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove active from all
                document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // Add active to current
                e.target.classList.add('active');
                const targetId = e.target.getAttribute('data-tab');
                document.getElementById(targetId).classList.add('active');
                
                if (targetId === 'reservations') {
                    this.updateExpiredReservations();
                }
            });
        });
    }

    setupFilters() {
        this.filters.client.addEventListener('input', () => this.renderReservations());
        this.filters.technician.addEventListener('input', () => this.renderReservations());
        this.filters.status.addEventListener('change', () => this.renderReservations());
        this.filters.sort.addEventListener('change', () => this.renderReservations());
    }

    async loadAllData() {
        this.data.clients = await window.db.getClients() || [];
        this.data.technicians = await window.db.getTechnicians() || [];
        this.data.categories = await window.db.getCategories() || [];
        this.data.reservations = await window.db.getReservations() || [];
        await this.updateExpiredReservations();
    }
    
    async updateExpiredReservations() {
        let changed = false;
        const now = new Date();
        for (let r of this.data.reservations) {
            const rDate = new Date(r.date);
            if (rDate < now && (r.status === 'pending' || r.status === 'assigned')) {
                r.status = 'expired';
                await window.db.saveReservation(r);
                changed = true;
            }
        }
        if (changed) {
            this.data.reservations = await window.db.getReservations();
            this.renderReservations();
        }
    }

    renderAll() {
        this.renderClients();
        this.renderTechnicians();
        this.renderCategories();
        this.renderReservations();
    }

    // --- MODALS ---
    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        if (modalId === 'technicianModal') this.renderTechnicianCategoriesCheckboxes();
        if (modalId === 'reservationModal') this.prepareReservationModal();
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        const form = document.querySelector(`#${modalId} form`);
        if (form) form.reset();
        const idInput = document.querySelector(`#${modalId} input[type="hidden"]`);
        if (idInput) idInput.value = '';
    }

    // --- CLIENTS ---
    renderClients() {
        const tbody = document.querySelector('#table-clients tbody');
        tbody.innerHTML = '';
        this.data.clients.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.rut}</td>
                <td>${c.name} ${c.lastname}</td>
                <td>${c.email}</td>
                <td>${c.phone}</td>
                <td>${c.address}</td>
                <td>
                    <button class="btn-edit" onclick="window.app.editClient('${c.id}')">Editar</button>
                    <button class="btn-danger" onclick="window.app.deleteClient('${c.id}')">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async saveClient(e) {
        e.preventDefault();
        const id = document.getElementById('client-id').value;
        const client = {
            id: id || null,
            name: document.getElementById('client-name').value,
            lastname: document.getElementById('client-lastname').value,
            rut: document.getElementById('client-rut').value,
            email: document.getElementById('client-email').value,
            phone: document.getElementById('client-phone').value,
            address: document.getElementById('client-address').value
        };
        
        // RUT uniqueness validation
        if (this.data.clients.some(c => c.rut === client.rut && c.id !== id)) {
            alert('Error: Ya existe un cliente con este RUT.');
            return;
        }

        // Editing validation if they have pending reservations
        if (id && this.hasPendingReservations('client', id)) {
            alert('No se puede editar: El cliente tiene reservas pendientes.');
            return;
        }

        await window.db.saveClient(client);
        await this.loadAllData();
        this.renderClients();
        this.closeModal('clientModal');
    }

    editClient(id) {
        if (this.hasPendingReservations('client', id)) {
            alert('No se puede editar: El cliente tiene reservas pendientes.');
            return;
        }
        const c = this.data.clients.find(c => c.id === id);
        if (!c) return;
        document.getElementById('client-id').value = c.id;
        document.getElementById('client-name').value = c.name;
        document.getElementById('client-lastname').value = c.lastname;
        document.getElementById('client-rut').value = c.rut;
        document.getElementById('client-email').value = c.email;
        document.getElementById('client-phone').value = c.phone;
        document.getElementById('client-address').value = c.address;
        document.getElementById('clientModalTitle').innerText = 'Editar Cliente';
        this.openModal('clientModal');
    }

    async deleteClient(id) {
        if (this.hasPendingReservations('client', id)) {
            alert('No se puede eliminar: El cliente tiene reservas pendientes.');
            return;
        }
        const c = this.data.clients.find(x => x.id === id);
        if (confirm(`¿Está seguro de eliminar a ${c.name} ${c.lastname}?`)) {
            await window.db.deleteClient(id);
            await this.loadAllData();
            this.renderClients();
        }
    }

    // --- CATEGORIES ---
    renderCategories() {
        const tbody = document.querySelector('#table-categories tbody');
        tbody.innerHTML = '';
        this.data.categories.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.name}</td>
                <td>${c.description}</td>
                <td>
                    <button class="btn-edit" onclick="window.app.editCategory('${c.id}')">Editar</button>
                    <button class="btn-danger" onclick="window.app.deleteCategory('${c.id}')">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async saveCategory(e) {
        e.preventDefault();
        const id = document.getElementById('category-id').value;
        const category = {
            id: id || null,
            name: document.getElementById('category-name').value,
            description: document.getElementById('category-description').value
        };

        if (id && this.hasPendingReservations('category', id)) {
            alert('No se puede editar: Esta categoría está asociada a reservas pendientes.');
            return;
        }

        await window.db.saveCategory(category);
        await this.loadAllData();
        this.renderCategories();
        this.closeModal('categoryModal');
    }

    editCategory(id) {
        if (this.hasPendingReservations('category', id)) {
            alert('No se puede editar: Esta categoría está asociada a reservas pendientes.');
            return;
        }
        const c = this.data.categories.find(c => c.id === id);
        if (!c) return;
        document.getElementById('category-id').value = c.id;
        document.getElementById('category-name').value = c.name;
        document.getElementById('category-description').value = c.description;
        document.getElementById('categoryModalTitle').innerText = 'Editar Categoría';
        this.openModal('categoryModal');
    }

    async deleteCategory(id) {
        if (this.hasPendingReservations('category', id)) {
            alert('No se puede eliminar: Esta categoría está asociada a reservas pendientes.');
            return;
        }
        
        const hasTechnician = this.data.technicians.some(t => t.categories.includes(id));
        if (hasTechnician) {
            alert('No se puede eliminar: Hay técnicos que soportan esta categoría.');
            return;
        }

        const cat = this.data.categories.find(x => x.id === id);
        if (confirm(`¿Está seguro de eliminar la categoría "${cat.name}"?`)) {
            await window.db.deleteCategory(id);
            await this.loadAllData();
            this.renderCategories();
        }
    }

    // --- TECHNICIANS ---
    renderTechnicians() {
        const tbody = document.querySelector('#table-technicians tbody');
        tbody.innerHTML = '';
        this.data.technicians.forEach(t => {
            const catsNames = t.categories.map(catId => {
                const c = this.data.categories.find(x => x.id === catId);
                return c ? c.name : 'Otra';
            }).join(', ');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.rut}</td>
                <td>${t.name} ${t.lastname}</td>
                <td>${t.email}</td>
                <td>${t.phone}</td>
                <td>${catsNames}</td>
                <td>
                    <button class="btn-edit" onclick="window.app.editTechnician('${t.id}')">Editar</button>
                    <button class="btn-danger" onclick="window.app.deleteTechnician('${t.id}')">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderTechnicianCategoriesCheckboxes(selected = []) {
        const container = document.getElementById('technician-categories-list');
        container.innerHTML = '';
        this.data.categories.forEach(c => {
            const div = document.createElement('div');
            const checked = selected.includes(c.id) ? 'checked' : '';
            div.innerHTML = `<label><input type="checkbox" value="${c.id}" class="technician-cat-check" ${checked}> ${c.name}</label>`;
            container.appendChild(div);
        });
    }

    async saveTechnician(e) {
        e.preventDefault();
        const id = document.getElementById('technician-id').value;
        const inputs = document.querySelectorAll('.technician-cat-check:checked');
        const selectedCategories = Array.from(inputs).map(inp => inp.value);

        if (selectedCategories.length === 0) {
            alert('El técnico debe tener al menos una categoría seleccionada.');
            return;
        }

        const technician = {
            id: id || null,
            name: document.getElementById('technician-name').value,
            lastname: document.getElementById('technician-lastname').value,
            rut: document.getElementById('technician-rut').value,
            email: document.getElementById('technician-email').value,
            phone: document.getElementById('technician-phone').value,
            address: document.getElementById('technician-address').value,
            categories: selectedCategories
        };

        // RUT uniqueness validation
        if (this.data.technicians.some(t => t.rut === technician.rut && t.id !== id)) {
            alert('Error: Ya existe un técnico con este RUT.');
            return;
        }

        if (id && this.hasPendingReservations('technician', id)) {
            alert('No se puede editar: El técnico tiene reservas pendientes.');
            return;
        }

        await window.db.saveTechnician(technician);
        await this.loadAllData();
        this.renderTechnicians();
        this.closeModal('technicianModal');
    }

    editTechnician(id) {
        if (this.hasPendingReservations('technician', id)) {
            alert('No se puede editar: El técnico tiene reservas pendientes.');
            return;
        }
        const t = this.data.technicians.find(t => t.id === id);
        if (!t) return;
        document.getElementById('technician-id').value = t.id;
        document.getElementById('technician-name').value = t.name;
        document.getElementById('technician-lastname').value = t.lastname;
        document.getElementById('technician-rut').value = t.rut;
        document.getElementById('technician-email').value = t.email;
        document.getElementById('technician-phone').value = t.phone;
        document.getElementById('technician-address').value = t.address;
        document.getElementById('technicianModalTitle').innerText = 'Editar Técnico';
        
        this.renderTechnicianCategoriesCheckboxes(t.categories);
        this.openModal('technicianModal');
    }

    async deleteTechnician(id) {
        if (this.hasPendingReservations('technician', id)) {
            alert('No se puede eliminar: El técnico tiene reservas pendientes.');
            return;
        }
        const t = this.data.technicians.find(x => x.id === id);
        if (confirm(`¿Está seguro de eliminar al técnico ${t.name} ${t.lastname}?`)) {
            await window.db.deleteTechnician(id);
            await this.loadAllData();
            this.renderTechnicians();
        }
    }

    // --- RESERVATIONS ---
    
    // Validation Helpers
    hasPendingReservations(type, id) {
        return this.data.reservations.some(r => {
            if (r.status !== 'pending') return false;
            if (type === 'client' && r.clientId === id) return true;
            if (type === 'technician' && r.technicianId === id) return true;
            if (type === 'category' && r.categoryId === id) return true;
            return false;
        });
    }

    prepareReservationModal() {
        // Establecer el mínimo de fecha/hora seleccionable en 24 horas hacia el futuro
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const isoString = in24Hours.toISOString().slice(0, 16);
        document.getElementById('reservation-date').min = isoString;

        const sClient = document.getElementById('reservation-client');
        const sTechnician = document.getElementById('reservation-technician');
        
        sClient.innerHTML = '<option value="">Seleccione un cliente...</option>';
        this.data.clients.forEach(c => {
            sClient.innerHTML += `<option value="${c.id}">${c.name} ${c.lastname} (${c.rut})</option>`;
        });

        sTechnician.innerHTML = '<option value="">Seleccione un técnico...</option>';
        this.data.technicians.forEach(t => {
            sTechnician.innerHTML += `<option value="${t.id}">${t.name} ${t.lastname}</option>`;
        });
        
        document.getElementById('reservation-category').innerHTML = '<option value="">Seleccione un técnico primero...</option>';
    }

    onChangeReservationClient() {
        const cId = document.getElementById('reservation-client').value;
        const c = this.data.clients.find(x => x.id === cId);
        if (c) {
            document.getElementById('reservation-address').value = c.address;
        } else {
            document.getElementById('reservation-address').value = '';
        }
    }

    updateReservationCategories() {
        const tId = document.getElementById('reservation-technician').value;
        const sCat = document.getElementById('reservation-category');
        sCat.innerHTML = '<option value="">Seleccione una categoría...</option>';
        
        const t = this.data.technicians.find(x => x.id === tId);
        if (t) {
            t.categories.forEach(catId => {
                const c = this.data.categories.find(x => x.id === catId);
                if (c) {
                    sCat.innerHTML += `<option value="${c.id}">${c.name}</option>`;
                }
            });
        }
    }

    renderReservations() {
        const tbody = document.querySelector('#table-reservations tbody');
        tbody.innerHTML = '';
        
        let filtered = this.data.reservations.slice();

        // Apply filters
        const fClient = this.filters.client.value.toLowerCase();
        const fTechnician = this.filters.technician.value.toLowerCase();
        const fStatus = this.filters.status.value;

        filtered = filtered.filter(r => {
            const client = this.data.clients.find(c => c.id === r.clientId);
            const technician = this.data.technicians.find(t => t.id === r.technicianId);
            const cliInfo = client ? `${client.name} ${client.lastname}`.toLowerCase() : '';
            const tecInfo = technician ? `${technician.name} ${technician.lastname}`.toLowerCase() : '';

            if (fClient && !cliInfo.includes(fClient)) return false;
            if (fTechnician && !tecInfo.includes(fTechnician)) return false;
            if (fStatus && r.status !== fStatus) return false;
            return true;
        });

        // Apply sort
        const sortVal = this.filters.sort.value;
        filtered.sort((a, b) => {
            if (sortVal === 'date') {
                return new Date(a.date) - new Date(b.date);
            } else if (sortVal === 'client') {
                const cA = this.data.clients.find(c => c.id === a.clientId);
                const cB = this.data.clients.find(c => c.id === b.clientId);
                const nA = cA ? cA.name : '';
                const nB = cB ? cB.name : '';
                return nA.localeCompare(nB);
            } else if (sortVal === 'technician') {
                const tA = this.data.technicians.find(t => t.id === a.technicianId);
                const tB = this.data.technicians.find(t => t.id === b.technicianId);
                const nA = tA ? tA.name : '';
                const nB = tB ? tB.name : '';
                return nA.localeCompare(nB);
            }
        });

        filtered.forEach(r => {
            const client = this.data.clients.find(c => c.id === r.clientId);
            const cliName = client ? `${client.name} ${client.lastname}` : 'Desconocido';
            
            const technician = this.data.technicians.find(t => t.id === r.technicianId);
            const tecName = technician ? `${technician.name} ${technician.lastname}` : 'Desconocido';

            const category = this.data.categories.find(c => c.id === r.categoryId);
            const catName = category ? category.name : 'Desconocido';

            const dateDisplay = new Date(r.date).toLocaleString('es-CL');

            // Maps internal english statuses to spanish UI text
            const statusDisplayMap = {
                pending: 'Pendiente',
                completed: 'Completada',
                cancelled: 'Cancelada',
                expired: 'Expirada',
                assigned: 'Asignada' // just in case
            };

            const tr = document.createElement('tr');
            
            let btnCancelar = r.status === 'pending' ? `<button class="btn-danger" onclick="window.app.cancelReservation('${r.id}')">Cancelar</button>` : '';
            let btnCompletar = r.status === 'pending' ? `<button class="btn-primary" style="margin-left: 0.5rem" onclick="window.app.completeReservation('${r.id}')">Completar</button>` : '';
            let btnPosponer = r.status === 'pending' ? `<button class="btn-edit" style="margin-left: 0.5rem" onclick="window.app.postponeReservation('${r.id}')">Posponer</button>` : '';

            tr.innerHTML = `
                <td>${dateDisplay}</td>
                <td>${cliName}</td>
                <td>${tecName}</td>
                <td>${catName}</td>
                <td><span class="badge ${r.status}">${(statusDisplayMap[r.status] || r.status).toUpperCase()}</span></td>
                <td>
                    ${btnPosponer}
                    ${btnCompletar}
                    ${btnCancelar}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async saveReservation(e) {
        e.preventDefault();
        const id = document.getElementById('reservation-id').value;
        const date = document.getElementById('reservation-date').value;
        const clientId = document.getElementById('reservation-client').value;
        const technicianId = document.getElementById('reservation-technician').value;
        const categoryId = document.getElementById('reservation-category').value;
        const address = document.getElementById('reservation-address').value;
        const description = document.getElementById('reservation-description').value;

        const dateObj = new Date(date);
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        if (dateObj < in24Hours) {
            alert('La fecha de la reserva debe ser al menos 24 horas después de la fecha actual.');
            return;
        }

        const hour = dateObj.getHours();
        if (hour < 9 || hour >= 18) {
            alert('El horario de atención es de 9:00 AM a 6:00 PM (18:00).');
            return;
        }

        // Validate technician doesn't have another reservation same day
        const sameDay = this.data.reservations.some(r => {
            if (r.id === id) return false;
            if (r.technicianId !== technicianId) return false;
            if (r.status === 'cancelled' || r.status === 'expired') return false;
            
            const rDate = new Date(r.date);
            return rDate.toDateString() === dateObj.toDateString();
        });

        if (sameDay) {
            alert('El técnico seleccionado ya tiene una reserva este día.');
            return;
        }
        
        // Validate client doesn't have another reservation same day
        const clientSameDay = this.data.reservations.some(r => {
            if (r.id === id) return false;
            if (r.clientId !== clientId) return false;
            if (r.status === 'cancelled' || r.status === 'expired') return false;
            
            const rDate = new Date(r.date);
            return rDate.toDateString() === dateObj.toDateString();
        });

        if (clientSameDay) {
            alert('El cliente seleccionado ya tiene una reserva este día.');
            return;
        }

        let reservation = {
            id: id || null,
            date: date,
            clientId,
            technicianId,
            categoryId,
            address,
            description,
            status: 'pending'
        };
        
        if (id) {
            // Edit existing (only postpone updates date, keeps status)
            const exists = this.data.reservations.find(x => x.id === id);
            if (exists) {
                reservation.status = exists.status;
            }
        }

        await window.db.saveReservation(reservation);
        await this.loadAllData();
        this.renderReservations();
        this.closeModal('reservationModal');
    }

    async postponeReservation(id) {
        const r = this.data.reservations.find(x => x.id === id);
        if (!r) return;
        
        document.getElementById('reservation-id').value = r.id;
        document.getElementById('reservation-date').value = r.date;
        
        await this.prepareReservationModal();
        
        document.getElementById('reservation-client').value = r.clientId;
        this.onChangeReservationClient();
        
        document.getElementById('reservation-technician').value = r.technicianId;
        this.updateReservationCategories();
        
        document.getElementById('reservation-category').value = r.categoryId;
        document.getElementById('reservation-address').value = r.address;
        document.getElementById('reservation-description').value = r.description;
        
        document.getElementById('reservationModalTitle').innerText = 'Posponer Reserva';
        this.openModal('reservationModal');
    }

    async cancelReservation(id) {
        if (confirm('¿Está seguro de cancelar esta reserva?')) {
            const r = this.data.reservations.find(x => x.id === id);
            if (r) {
                r.status = 'cancelled';
                await window.db.saveReservation(r);
                await this.loadAllData();
                this.renderReservations();
            }
        }
    }

    async completeReservation(id) {
        if (confirm('¿Marcar reserva como completada?')) {
            const r = this.data.reservations.find(x => x.id === id);
            if (r) {
                r.status = 'completed';
                await window.db.saveReservation(r);
                await this.loadAllData();
                this.renderReservations();
            }
        }
    }
}

// Init application when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
