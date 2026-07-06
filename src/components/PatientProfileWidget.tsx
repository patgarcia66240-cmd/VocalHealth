import React, { useState, useEffect, useMemo } from "react";
import { User, Edit2, Check, X, ChevronDown } from "lucide-react";
import { PatientProfile } from "../types";
import { calculateAge } from "../utils";
import { motion, AnimatePresence } from "motion/react";
import {
  getPatientProfileKey,
  loadPatientProfile,
  mergePatientProfiles,
  removePatientProfile,
  savePatientProfile,
  selectPatientProfile,
  upsertPatientProfile,
} from "../services/patientProfiles";

interface PatientProfileWidgetProps {
  currentProfile?: PatientProfile | null;
  onProfileChange?: (profile: PatientProfile | null) => void;
}

export default function PatientProfileWidget({ currentProfile, onProfileChange }: PatientProfileWidgetProps) {
  const [profile, setProfile] = useState<PatientProfile | null>(() => {
    if (currentProfile !== undefined) {
      return currentProfile;
    }

    return loadPatientProfile();
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showPatientSelect, setShowPatientSelect] = useState(false);
  
  // Local form state
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [cp, setCp] = useState("");
  const [ville, setVille] = useState("");
  const [tel, setTel] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");

  const patientProfiles = useMemo(() => {
    return mergePatientProfiles(profile);
  }, [profile]);

  useEffect(() => {
    if (currentProfile !== undefined) {
      setProfile(currentProfile);
      setIsEditing(false);
    }
  }, [currentProfile]);

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

    savePatientProfile(updatedProfile);
    upsertPatientProfile(updatedProfile);
    setProfile(updatedProfile);
    setIsEditing(false);
    if (onProfileChange) {
      onProfileChange(updatedProfile);
    }
  };

  const handleClear = () => {
    if (confirm("Voulez-vous supprimer les informations de votre profil patient ?")) {
      if (profile) {
        removePatientProfile(profile);
      }
      savePatientProfile(null);
      setProfile(null);
      setIsEditing(false);
      if (onProfileChange) {
        onProfileChange(null);
      }
    }
  };

  const handleSelectPatient = (selectedProfile: PatientProfile) => {
    selectPatientProfile(selectedProfile, patientProfiles);
    setProfile(selectedProfile);
    setIsEditing(false);
    setShowPatientSelect(false);
    onProfileChange?.(selectedProfile);
  };

  const age = profile ? calculateAge(profile.dateNaissance) : null;

  return (
    <>
    <div className="bg-linear-to-br from-natural-surface to-natural-card/30 rounded-[28px] border border-natural-border/50 p-4 shadow-lg shadow-natural-primary/5 space-y-3 backdrop-blur-sm" id="patient-profile-card">
      <div className="flex items-center justify-between border-b border-natural-border/40 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-linear-to-br from-natural-primary/10 to-natural-accent/10 rounded-xl text-natural-primary shadow-sm">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-natural-dark text-sm font-sans tracking-tight">Profil Patient</h3>
            <p className="text-[10px] text-natural-secondary font-semibold font-sans uppercase tracking-widest opacity-80">Identité médicale</p>
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
                className="p-2.5 border border-natural-border/50 hover:border-natural-primary hover:bg-natural-primary/5 rounded-xl text-natural-primary transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-sm hover:shadow-md"
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
            className="space-y-2 text-xs"
            id="profile-form"
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-natural-secondary font-sans text-[10px] uppercase tracking-wider">Prénom</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Jean"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border/50 rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/20 focus:border-natural-primary bg-white/80 backdrop-blur-sm font-sans shadow-sm transition-all"
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
                  className="w-full px-2 py-1 border border-natural-border rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/10 focus:border-natural-primary bg-natural-bg font-sans"
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
                className="w-full px-3 py-2 border border-natural-border/50 rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/20 focus:border-natural-primary bg-white/80 backdrop-blur-sm font-sans shadow-sm transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-natural-secondary font-sans text-[10px] uppercase tracking-wider">Téléphone</label>
              <input
                type="tel"
                placeholder="Ex: 06 12 34 56 78"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                className="w-full px-3 py-2 border border-natural-border/50 rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/20 focus:border-natural-primary bg-white/80 backdrop-blur-sm font-sans shadow-sm transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-natural-secondary font-sans text-[10px] uppercase tracking-wider">Adresse</label>
              <input
                type="text"
                placeholder="Ex: 12 Rue de la Paix"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="w-full px-3 py-2 border border-natural-border/50 rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/20 focus:border-natural-primary bg-white/80 backdrop-blur-sm font-sans shadow-sm transition-all"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1 space-y-1">
                <label className="font-bold text-natural-secondary font-sans text-[10px] uppercase tracking-wider">CP</label>
                <input
                  type="text"
                  placeholder="Ex: 75001"
                  value={cp}
                  onChange={(e) => setCp(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border/50 rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/20 focus:border-natural-primary bg-white/80 backdrop-blur-sm font-sans shadow-sm transition-all"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="font-bold text-natural-secondary font-sans text-[10px] uppercase tracking-wider">Ville</label>
                <input
                  type="text"
                  placeholder="Ex: Paris"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border/50 rounded-xl text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/20 focus:border-natural-primary bg-white/80 backdrop-blur-sm font-sans shadow-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-3 py-2.5 bg-linear-to-r from-natural-primary to-natural-accent text-white rounded-xl text-xs font-bold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              id="save-profile-btn"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Enregistrer</span>
            </button>
          </motion.form>
        ) : profile ? (
          <motion.div
            key="display-profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
            id="profile-info-display"
          >
            {/* Identity details */}
            <button
              type="button"
              onClick={() => setShowPatientSelect(true)}
              className="group flex w-full items-center gap-3 bg-linear-to-r from-natural-primary/5 to-natural-accent/5 p-4 rounded-2xl border border-natural-border/30 shadow-sm text-left transition-all hover:border-natural-primary/40 hover:shadow-md"
              title="Changer de patient"
            >
              <div className="h-12 w-12 rounded-full bg-linear-to-br from-natural-primary to-natural-accent text-white flex items-center justify-center font-bold text-base shadow-md">
                {prenom.charAt(0).toUpperCase()}{nom.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base text-natural-dark truncate tracking-tight">{prenom} {nom}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-natural-secondary font-semibold font-sans">Patient</span>
                  {age !== null && (
                    <span className="text-[11px] bg-linear-to-r from-natural-primary/10 to-natural-accent/10 text-natural-primary font-bold px-2.5 py-0.5 rounded-full border border-natural-primary/20">
                      {age} ans
                    </span>
                  )}
                </div>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-natural-border/70 bg-white/70 text-natural-secondary transition-all group-hover:text-natural-primary">
                <ChevronDown className="h-4 w-4" />
              </div>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty-profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4 px-3 bg-linear-to-br from-natural-card/30 to-natural-bg/40 rounded-2xl border border-dashed border-natural-border/60 flex flex-col items-center justify-center gap-2"
            id="profile-empty-state"
          >
            <div className="p-2.5 bg-linear-to-br from-natural-primary/10 to-natural-accent/10 rounded-full text-natural-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-natural-dark">Aucun profil patient</p>
              <p className="text-[10px] text-natural-secondary mt-1 max-w-45 mx-auto leading-relaxed">
                Créez votre profil pour un suivi personnalisé
              </p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-1 px-4 py-2 bg-linear-to-r from-natural-primary/10 to-natural-accent/10 hover:from-natural-primary hover:to-natural-accent text-natural-primary hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              Créer mon profil
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    <AnimatePresence>
      {showPatientSelect && (
        <motion.div
          role="dialog"
          aria-modal="false"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="relative z-40 mt-2 flex max-h-72 w-full flex-col overflow-hidden rounded-3xl border border-natural-border bg-natural-surface shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-natural-border/60 px-4 py-3">
            <div>
              <h3 className="text-sm font-extrabold text-natural-dark">Changer de patient</h3>
            </div>
            <button
              onClick={() => setShowPatientSelect(false)}
              className="rounded-full p-2 text-natural-secondary transition-all hover:bg-natural-bg hover:text-natural-dark"
              title="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {patientProfiles.length > 0 ? (
              <div className="space-y-1.5">
                {patientProfiles.map((item) => {
                  const isActive = profile ? getPatientProfileKey(item) === getPatientProfileKey(profile) : false;

                  return (
                    <button
                      type="button"
                      key={getPatientProfileKey(item)}
                      onClick={() => handleSelectPatient(item)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:border-natural-primary/40 hover:bg-natural-primary/5 ${
                        isActive
                          ? "border-natural-primary/40 bg-natural-primary/10"
                          : "border-natural-border/50 bg-natural-bg/40"
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                        isActive
                          ? "bg-natural-primary text-white"
                          : "bg-natural-primary/10 text-natural-primary"
                      }`}>
                        {item.prenom.charAt(0).toUpperCase()}{item.nom.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-natural-dark">
                          {item.prenom} {item.nom}
                        </p>
                        <p className="text-xs font-medium text-natural-secondary">
                          {calculateAge(item.dateNaissance)} ans
                        </p>
                      </div>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        isActive
                          ? "border-natural-primary bg-natural-primary text-white"
                          : "border-natural-border bg-white"
                      }`}>
                        {isActive && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-natural-border bg-natural-bg/40 p-4 text-sm text-natural-secondary">
                Aucun autre patient enregistré pour le moment.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}



