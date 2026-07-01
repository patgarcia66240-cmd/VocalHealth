import React, { useState, useEffect } from "react";
import { User, Phone, MapPin, Calendar, Edit2, Check, X, ShieldAlert } from "lucide-react";
import { PatientProfile } from "../types";
import { calculateAge } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface PatientProfileWidgetProps {
  onProfileChange?: (profile: PatientProfile | null) => void;
}

export default function PatientProfileWidget({ onProfileChange }: PatientProfileWidgetProps) {
  const [profile, setProfile] = useState<PatientProfile | null>(() => {
    const saved = localStorage.getItem("patient_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse patient profile", e);
      }
    }
    return null;
  });

  const [isEditing, setIsEditing] = useState(false);
  
  // Local form state
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [cp, setCp] = useState("");
  const [ville, setVille] = useState("");
  const [tel, setTel] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");

  // Sync state when entering edit mode
  useEffect(() => {
    if (profile) {
      setNom(profile.nom);
      setPrenom(profile.prenom);
      setAdresse(profile.adresse);
      setCp(profile.cp);
      setVille(profile.ville);
      setTel(profile.tel);
      setDateNaissance(profile.dateNaissance);
    } else {
      setNom("");
      setPrenom("");
      setAdresse("");
      setCp("");
      setVille("");
      setTel("");
      setDateNaissance("");
    }
  }, [isEditing, profile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: PatientProfile = {
      nom: nom.trim(),
      prenom: prenom.trim(),
      adresse: adresse.trim(),
      cp: cp.trim(),
      ville: ville.trim(),
      tel: tel.trim(),
      dateNaissance: dateNaissance
    };
    
    localStorage.setItem("patient_profile", JSON.stringify(updatedProfile));
    setProfile(updatedProfile);
    setIsEditing(false);
    if (onProfileChange) {
      onProfileChange(updatedProfile);
    }
  };

  const handleClear = () => {
    if (confirm("Voulez-vous supprimer les informations de votre profil patient ?")) {
      localStorage.removeItem("patient_profile");
      setProfile(null);
      setIsEditing(false);
      if (onProfileChange) {
        onProfileChange(null);
      }
    }
  };

  const age = profile ? calculateAge(profile.dateNaissance) : null;

  return (
    <div className="bg-natural-surface rounded-[32px] border border-natural-border p-6 shadow-sm space-y-4" id="patient-profile-card">
      <div className="flex items-center justify-between border-b border-natural-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-natural-primary/10 rounded-xl text-natural-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-natural-primary text-sm font-sans">Profil Patient</h3>
            <p className="text-[10px] text-natural-secondary font-semibold font-mono uppercase tracking-wider">Identité & Constantes</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              {profile && (
                <button
                  onClick={handleClear}
                  className="text-[10px] text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Effacer le profil"
                >
                  Effacer
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 border border-natural-border hover:bg-natural-bg rounded-xl text-natural-primary transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                id="edit-profile-btn"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>{profile ? "Modifier" : "Créer"}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 text-natural-secondary hover:text-natural-primary hover:bg-natural-bg rounded-lg transition-colors cursor-pointer"
              title="Annuler"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.form
            key="editing-form"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            onSubmit={handleSave}
            className="space-y-3 text-xs"
            id="profile-form"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-natural-secondary font-sans text-[10px] uppercase tracking-wider">Prénom</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Jean"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/10 focus:border-natural-primary bg-natural-bg font-sans"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-natural-secondary font-sans text-[10px] uppercase tracking-wider">Nom</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dupont"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/10 focus:border-natural-primary bg-natural-bg font-sans"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-natural-secondary font-sans text-[10px] uppercase tracking-wider">Date de naissance</label>
              <input
                type="date"
                required
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                className="w-full px-3 py-2 border border-natural-border rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/10 focus:border-natural-primary bg-natural-bg font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-natural-secondary font-sans text-[10px] uppercase tracking-wider">Téléphone</label>
              <input
                type="tel"
                required
                placeholder="Ex: 06 12 34 56 78"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                className="w-full px-3 py-2 border border-natural-border rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/10 focus:border-natural-primary bg-natural-bg font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-natural-secondary font-sans text-[10px] uppercase tracking-wider">Adresse</label>
              <input
                type="text"
                required
                placeholder="Ex: 12 Rue de la Paix"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="w-full px-3 py-2 border border-natural-border rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/10 focus:border-natural-primary bg-natural-bg font-sans"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-1">
                <label className="font-bold text-natural-secondary font-sans text-[10px] uppercase tracking-wider">Code Postal</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 75001"
                  value={cp}
                  onChange={(e) => setCp(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/10 focus:border-natural-primary bg-natural-bg font-sans"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="font-bold text-natural-secondary font-sans text-[10px] uppercase tracking-wider">Ville</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Paris"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/10 focus:border-natural-primary bg-natural-bg font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2 bg-natural-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              id="save-profile-btn"
            >
              <Check className="h-4 w-4" />
              <span>Enregistrer le Profil</span>
            </button>
          </motion.form>
        ) : profile ? (
          <motion.div
            key="display-profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
            id="profile-info-display"
          >
            {/* Identity details */}
            <div className="flex items-center gap-3.5 bg-natural-bg/50 p-4 rounded-2xl border border-natural-border/50">
              <div className="h-12 w-12 rounded-full bg-natural-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {prenom.charAt(0).toUpperCase()}{nom.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-natural-dark truncate">{prenom} {nom}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-natural-secondary font-semibold font-mono">Patient</span>
                  {age !== null && (
                    <span className="text-[10px] bg-natural-primary/15 text-natural-primary font-bold px-2 py-0.5 rounded-full">
                      {age} ans
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile fields list */}
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-natural-secondary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-natural-secondary uppercase tracking-wider">Date de naissance</p>
                  <p className="font-semibold text-natural-dark mt-0.5">
                    {new Date(profile.dateNaissance).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-natural-secondary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-natural-secondary uppercase tracking-wider">Téléphone</p>
                  <p className="font-mono font-semibold text-natural-dark mt-0.5">{profile.tel}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-natural-secondary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-natural-secondary uppercase tracking-wider">Adresse résidentielle</p>
                  <p className="font-semibold text-natural-dark mt-0.5">{profile.adresse}</p>
                  <p className="text-natural-secondary font-medium">{profile.cp} {profile.ville}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty-profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6 px-4 bg-natural-bg/40 rounded-2xl border border-dashed border-natural-border flex flex-col items-center justify-center gap-3"
            id="profile-empty-state"
          >
            <div className="p-3 bg-natural-primary/10 rounded-full text-natural-primary">
              <User className="h-6 w-6 opacity-80" />
            </div>
            <div>
              <p className="text-xs font-bold text-natural-dark">Aucun profil patient enregistré</p>
              <p className="text-[10px] text-natural-secondary mt-1 max-w-[220px] mx-auto leading-relaxed">
                Renseignez votre identité et date de naissance pour calculer et afficher votre âge.
              </p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-1 px-4 py-1.5 bg-natural-primary/10 hover:bg-natural-primary text-natural-primary hover:text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer"
            >
              Créer mon profil
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
