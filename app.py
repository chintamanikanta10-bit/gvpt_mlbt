import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from models import db, AdminUser, AdmissionInquiry, ContactMessage, GalleryItem

app = Flask(__name__)
app.config['SECRET_KEY'] = 'gvp-school-super-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///school.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'images', 'gallery')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'admin_login'

@login_manager.user_loader
def load_user(user_id):
    return AdminUser.query.get(int(user_id))

# ----------------- PUBLIC ROUTES -----------------
@app.route('/')
@app.route('/index.html')
def index():
    return render_template('index.html')

@app.route('/about.html')
@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/academics.html')
@app.route('/academics')
def academics():
    return render_template('academics.html')

@app.route('/admissions.html', methods=['GET', 'POST'])
@app.route('/admissions', methods=['GET', 'POST'])
def admissions():
    if request.method == 'POST':
        try:
            inquiry = AdmissionInquiry(
                student_name=request.form.get('studentName'),
                grade_requested=request.form.get('gradeRequested'),
                parent_name=request.form.get('parentName'),
                mobile_number=request.form.get('mobileNumber'),
                email_address=request.form.get('emailAddress'),
                residence_address=request.form.get('residenceAddress'),
                queries=request.form.get('queries')
            )
            db.session.add(inquiry)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Inquiry submitted successfully! We will contact you soon.'})
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 400
    return render_template('admissions.html')

@app.route('/gallery.html')
@app.route('/gallery')
def gallery():
    items = GalleryItem.query.order_by(GalleryItem.priority.asc(), GalleryItem.created_at.desc()).all()
    return render_template('gallery.html', gallery_items=items)

@app.route('/contact.html', methods=['GET', 'POST'])
@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        try:
            msg = ContactMessage(
                full_name=request.form.get('contactName'),
                email_address=request.form.get('contactEmail'),
                subject=request.form.get('contactSubject'),
                message=request.form.get('contactMessage')
            )
            db.session.add(msg)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Message sent successfully!'})
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 400
    return render_template('contact.html')


# ----------------- ADMIN ROUTES -----------------
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if current_user.is_authenticated:
        return redirect(url_for('admin_dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = AdminUser.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid username or password', 'danger')
            
    return render_template('admin_login.html')

@app.route('/admin/logout')
@login_required
def admin_logout():
    logout_user()
    return redirect(url_for('admin_login'))

@app.route('/admin')
@login_required
def admin_dashboard():
    inquiries_count = AdmissionInquiry.query.count()
    messages_count = ContactMessage.query.count()
    gallery_count = GalleryItem.query.count()
    return render_template('admin_dashboard.html', 
                           inquiries=inquiries_count, 
                           messages=messages_count, 
                           gallery=gallery_count)

@app.route('/admin/admissions')
@login_required
def admin_admissions():
    inquiries = AdmissionInquiry.query.order_by(AdmissionInquiry.created_at.desc()).all()
    return render_template('admin_admissions.html', inquiries=inquiries)

@app.route('/admin/contacts')
@login_required
def admin_contacts():
    messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    return render_template('admin_contacts.html', messages=messages)

@app.route('/admin/gallery', methods=['GET', 'POST'])
@login_required
def admin_gallery():
    if request.method == 'POST':
        file = request.files.get('image')
        category = request.form.get('category')
        title = request.form.get('title')
        priority_val = request.form.get('priority')
        
        priority = 9999
        if priority_val and priority_val.strip().isdigit():
            priority = int(priority_val.strip())
        
        if file and file.filename:
            filename = secure_filename(file.filename)
            # Add timestamp to prevent overwriting
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            filename = f"{timestamp}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Save relative path for template
            db_path = f"images/gallery/{filename}"
            new_item = GalleryItem(image_path=db_path, category=category, title=title, priority=priority)
            db.session.add(new_item)
            db.session.commit()
            flash('Image uploaded successfully!', 'success')
            return redirect(url_for('admin_gallery'))
            
    items = GalleryItem.query.order_by(GalleryItem.priority.asc(), GalleryItem.created_at.desc()).all()
    return render_template('admin_gallery.html', items=items)

@app.route('/admin/gallery/delete/<int:id>', methods=['POST'])
@login_required
def admin_gallery_delete(id):
    item = GalleryItem.query.get_or_404(id)
    try:
        # Optional: remove file from disk
        file_path = os.path.join(app.root_path, 'static', item.image_path)
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass
    db.session.delete(item)
    db.session.commit()
    flash('Gallery item deleted.', 'info')
    return redirect(url_for('admin_gallery'))

@app.route('/admin/gallery/update_priority/<int:id>', methods=['POST'])
@login_required
def admin_gallery_update_priority(id):
    item = GalleryItem.query.get_or_404(id)
    priority_val = request.form.get('priority')
    print(f"DEBUG: Updating priority for item {id}. Received value: '{priority_val}'")
    
    try:
        if priority_val is not None and priority_val.strip() != '':
            new_priority = int(priority_val.strip())
            item.priority = new_priority
            print(f"DEBUG: Set priority to {new_priority}")
        else:
            item.priority = 9999
            print("DEBUG: Set priority to default 9999")
    except ValueError:
        item.priority = 9999
        print("DEBUG: Invalid number, set to default 9999")
        
    db.session.commit()
    flash('Priority updated successfully.', 'success')
    return redirect(url_for('admin_gallery'))

with app.app_context():
    db.create_all()
    # Create default admin if not exists
    if not AdminUser.query.filter_by(username='admin').first():
        hashed_pw = generate_password_hash('admin')
        default_admin = AdminUser(username='admin', password_hash=hashed_pw)
        db.session.add(default_admin)
        db.session.commit()
        print("Default admin created (admin:admin)")

if __name__ == '__main__':
    app.run(debug=True,port=8080)
