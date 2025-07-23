import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { ExternalLink, AlertTriangle } from "lucide-react";

interface Facility {
  id: number;
  nameEn: string;
  nameAr: string;
}

interface Category {
  id: number;
  name: string;
}

// Department options
const DEPARTMENTS = [
  "Nursing Services (Wards, OR, ICU, NICU, ER, Endoscopy etc)",
  "ER",
  "OPD", 
  "ICU",
  "NICU",
  "OR",
  "OR Coordination",
  "Anesthesia",
  "Radiology / Imaging",
  "Laboratory / Pathology",
  "Pharmacy",
  "Internal Medicine",
  "General Surgery",
  "Neurosurgry",
  "Orthopedics",
  "Pediatrics",
  "Obstetrics & Gynecology (OB/GYN)",
  "Urology",
  "Cardiology",
  "Neurology",
  "ENT",
  "Dermatology",
  "Ophthalmology",
  "Nephrology",
  "Dialysis Unit",
  "Endoscopy Unit",
  "Rehabilitation / Physiotherapy",
  "Infection Control",
  "Biomedical Engineering",
  "Supply Chain / Central Supply",
  "Housekeeping / Environmental Services",
  "Nutrition",
  "Maintenance & Engineering",
  "IT",
  "Administration / Executive Offices",
  "Security",
  "Social Work",
  "Mental Health / Psychiatry",
  "Mortuary",
  "Patient Affairs (Registration, Medical Reports, etc)",
  "Other"
];

// OVR Categories (32+ options as mentioned)
const OVR_CATEGORIES = [
  "Patient Fall",
  "Medication Error",
  "Healthcare Associated Infection",
  "Surgical Complications",
  "Diagnostic Error",
  "Equipment Malfunction",
  "Documentation Error",
  "Communication Failure",
  "Delayed Treatment",
  "Wrong Patient/Site/Procedure",
  "Blood/Blood Product Error",
  "Laboratory Error",
  "Radiology Error",
  "Anesthesia Complication",
  "Pressure Injury",
  "Patient Identification Error",
  "Discharge Planning Issue",
  "Security Incident",
  "Fire Safety",
  "Hazardous Material Exposure",
  "Visitor Incident",
  "Staff Injury",
  "Violence/Aggression",
  "Property Damage",
  "IT/Technology Failure",
  "Supply Chain Issue",
  "Environmental Hazard",
  "Infection Control Breach",
  "Privacy/Confidentiality Breach",
  "Consent Issue",
  "Transportation Incident",
  "Other"
];

// Type of Injury options
const INJURY_TYPES = [
  "No Injury",
  "Bruise/Contusion",
  "Laceration/Cut",
  "Fracture",
  "Sprain/Strain",
  "Burn",
  "Infection",
  "Allergic Reaction",
  "Respiratory Distress",
  "Cardiac Event",
  "Neurological Impairment",
  "Psychological Trauma",
  "Death",
  "Other"
];

// Reporter Position options
const REPORTER_POSITIONS = [
  "Nurse",
  "Doctor/Physician",
  "Pharmacist",
  "Technician",
  "Therapist",
  "Administrator",
  "Support Staff",
  "Security",
  "Student/Trainee",
  "Volunteer",
  "Other"
];

const comprehensiveIncidentSchema = z.object({
  // Basic Information
  facilityId: z.number().min(1, "Please select a facility"),
  incidentDate: z.string().min(1, "Please select incident date"),
  incidentTime: z.string().min(1, "Please enter incident time"),
  
  // Department Information
  reportingDepartment: z.string().min(1, "Please select reporting department"),
  respondingDepartment: z.string().min(1, "Please select responding department"),
  
  // Patient Information
  patientName: z.string().optional(),
  medicalRecord: z.string().min(1, "Medical record number is required"),
  
  // Incident Details
  whatIsBeingReported: z.enum(["incident", "near_miss", "mandatory_reportable_event", "sentinel_event"]),
  description: z.string().min(10, "Please provide a detailed description"),
  
  // Reporter Information (Optional)
  reporterName: z.string().optional(),
  reporterMobile: z.string().optional(),
  reporterEmail: z.string().email().optional().or(z.literal("")),
  reporterPosition: z.string().optional(),
  
  // Action & Classification
  actionTaken: z.string().min(10, "Please describe actions taken during incident"),
  ovrCategory: z.string().min(1, "Please select OVR category"),
  typeOfInjury: z.array(z.string()).min(1, "Please select at least one injury type"),
  levelOfHarm: z.enum(["no_harm", "low", "moderate", "severe", "death"]),
  likelihoodCategory: z.enum(["rare", "unlikely", "possible", "likely", "almost_certain"]),
  medicationErrorDetails: z.string().optional(),
  
  // Legacy fields for compatibility
  category: z.string().default("general"),
});

type ComprehensiveIncidentFormValues = z.infer<typeof comprehensiveIncidentSchema>;

export function ComprehensiveIncidentForm() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ovrId, setOvrId] = useState<string>("");
  const [showMedicationError, setShowMedicationError] = useState(false);

  const { data: facilities } = useQuery<Facility[]>({
    queryKey: ['/api/facilities'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const form = useForm<ComprehensiveIncidentFormValues>({
    resolver: zodResolver(comprehensiveIncidentSchema),
    defaultValues: {
      facilityId: 0,
      incidentDate: "",
      incidentTime: "",
      reportingDepartment: "",
      respondingDepartment: "",
      patientName: "",
      medicalRecord: "",
      whatIsBeingReported: "incident",
      description: "",
      reporterName: "",
      reporterMobile: "",
      reporterEmail: "",
      reporterPosition: "",
      actionTaken: "",
      ovrCategory: "",
      typeOfInjury: [],
      levelOfHarm: "no_harm",
      likelihoodCategory: "rare",
      medicationErrorDetails: "",
      category: "general",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ComprehensiveIncidentFormValues) => {
      const response = await apiRequest("POST", "/api/incidents/public", data);
      return response.json();
    },
    onSuccess: (data) => {
      setOvrId(data.ovrId);
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      toast({
        title: "Incident reported successfully",
        description: `OVR ID: ${data.ovrId}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting incident",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ComprehensiveIncidentFormValues) => {
    submitMutation.mutate(data);
  };

  // Watch for OVR category changes to show medication error field
  const selectedOvrCategory = form.watch("ovrCategory");
  
  if (selectedOvrCategory === "Medication Error" && !showMedicationError) {
    setShowMedicationError(true);
  } else if (selectedOvrCategory !== "Medication Error" && showMedicationError) {
    setShowMedicationError(false);
  }

  if (isSubmitted) {
    return (
      <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Incident Reported Successfully</h3>
              <p className="text-gray-600 mb-4">Your incident has been submitted and assigned OVR ID:</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-lg font-mono font-semibold text-blue-800">{ovrId}</p>
              </div>
              <p className="text-sm text-gray-500">
                Please save this OVR ID for your records. You will receive updates on the investigation progress.
              </p>
            </div>
            <Button 
              onClick={() => {
                setIsSubmitted(false);
                setOvrId("");
                form.reset();
              }}
              className="w-full"
            >
              Report Another Incident
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Event Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="facilityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Facility *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select facility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {facilities?.map((facility) => (
                        <SelectItem key={facility.id} value={facility.id.toString()}>
                          {facility.nameEn} - {facility.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="incidentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Date of Event *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="incidentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Time of Event *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Department Information */}
        <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Department Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="reportingDepartment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Reporting Department/Section *</FormLabel>
                  <FormDescription className="text-sm text-gray-500">
                    From which department are you reporting?
                  </FormDescription>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reporting department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="respondingDepartment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Responding Department/Section *</FormLabel>
                  <FormDescription className="text-sm text-gray-500">
                    To which department do you report the incident?
                  </FormDescription>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select responding department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Patient Information */}
        <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Patient Name</FormLabel>
                  <FormDescription className="text-sm text-gray-500">
                    Optional - if available
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="Patient name (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medicalRecord"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Medical Record Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter medical record number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Incident Details */}
        <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Incident Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="whatIsBeingReported"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">What is being reported? *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="incident"
                          checked={field.value === "incident"}
                          onChange={() => field.onChange("incident")}
                          className="text-blue-600"
                        />
                        <span>Incident</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="near_miss"
                          checked={field.value === "near_miss"}
                          onChange={() => field.onChange("near_miss")}
                          className="text-blue-600"
                        />
                        <span>Near miss (An event that could have resulted in an adverse but did not occur/did not reach the patient)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="mandatory_reportable_event"
                          checked={field.value === "mandatory_reportable_event"}
                          onChange={() => field.onChange("mandatory_reportable_event")}
                          className="text-blue-600"
                        />
                        <span className="flex items-center">
                          Mandatory Reportable Event 
                          <a href="/assets/mandatory-reportable-events.jpg" target="_blank" className="ml-2 text-blue-600 hover:text-blue-800">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="sentinel_event"
                          checked={field.value === "sentinel_event"}
                          onChange={() => field.onChange("sentinel_event")}
                          className="text-blue-600"
                        />
                        <span className="flex items-center">
                          Sentinel Event 
                          <a href="https://resources.spsc.gov.sa/SERMP-V1.pdf" target="_blank" className="ml-2 text-blue-600 hover:text-blue-800">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </span>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Incident Description *</FormLabel>
                  <FormDescription className="text-sm text-gray-500">
                    Kindly report detailed description, without names
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a detailed description of the incident without mentioning names..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Reporter Information */}
        <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Reporter Information</CardTitle>
            <p className="text-sm text-gray-500">Fill this section if you want feedback</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reporterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Reporter Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reporterMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Your mobile number (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reporterEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Your email (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reporterPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Position Title</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your position (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REPORTER_POSITIONS.map((position) => (
                          <SelectItem key={position} value={position}>
                            {position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action & Classification */}
        <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Action & Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="actionTaken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Action taken during incident *</FormLabel>
                  <FormDescription className="text-sm text-gray-500">
                    Filled out by reporter
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the actions taken during the incident..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ovrCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">OVR Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select OVR category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {OVR_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="typeOfInjury"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Type of Injury *</FormLabel>
                  <FormDescription className="text-sm text-gray-500">
                    Select all that apply
                  </FormDescription>
                  <FormControl>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {INJURY_TYPES.map((injury) => (
                        <label key={injury} className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value?.includes(injury)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, injury]);
                              } else {
                                field.onChange(field.value.filter((i) => i !== injury));
                              }
                            }}
                          />
                          <span className="text-sm">{injury}</span>
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="levelOfHarm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Level of Harm *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level of harm" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no_harm">No Harm</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                        <SelectItem value="death">Death</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="likelihoodCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Likelihood Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select likelihood" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rare">Rare</SelectItem>
                        <SelectItem value="unlikely">Unlikely</SelectItem>
                        <SelectItem value="possible">Possible</SelectItem>
                        <SelectItem value="likely">Likely</SelectItem>
                        <SelectItem value="almost_certain">Almost Certain</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showMedicationError && (
              <FormField
                control={form.control}
                name="medicationErrorDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                      For Medication Error only
                    </FormLabel>
                    <FormDescription className="text-sm text-gray-500">
                      Additional details required for medication errors
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Provide specific details about the medication error..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="min-w-[120px]"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </form>
    </Form>
  );
}