import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  company: z.string().min(2, "Company name is required"),
  phone: z.string().min(10, "Invalid phone"),
  message: z.string().optional(),
});

export function Contact() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      message: "",
    },
  });

  const submitLead = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request submitted!",
        description: "One of our specialists will contact you soon.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitLead.mutate(values);
  }

  return (
    <section id="contact" className="bg-purple-section" style={{ padding: "6rem 2rem" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left Column - Info */}
          <div>
            <h2 className="section-headline mb-6">Contact Us</h2>
            <p className="text-xl text-[#374151] mb-10">
              Ready to start saving? Get your free energy analysis today.
            </p>
            
            {/* Contact info cards */}
            <div className="space-y-4">
              <div className="card-dcvc bg-white">
                <p className="text-sm font-medium text-[#6B46C1] uppercase tracking-wide mb-1">Email</p>
                <p className="text-lg text-[#374151]">contato@otimaenergia.com.br</p>
              </div>
              <div className="card-dcvc bg-white">
                <p className="text-sm font-medium text-[#6B46C1] uppercase tracking-wide mb-1">Phone</p>
                <p className="text-lg text-[#374151]">+55 21 99999-9999</p>
              </div>
              <div className="card-dcvc bg-white">
                <p className="text-sm font-medium text-[#6B46C1] uppercase tracking-wide mb-1">Location</p>
                <p className="text-lg text-[#374151]">Rio de Janeiro, Brazil</p>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="card-dcvc bg-white">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-[#374151]">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your name" 
                            data-testid="input-name" 
                            className="h-12 border-[#E5E7EB] rounded-md focus:border-[#6B46C1] focus:ring-[#6B46C1]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-[#374151]">
                          Phone
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+55 21 99999-9999" 
                            data-testid="input-phone" 
                            className="h-12 border-[#E5E7EB] rounded-md focus:border-[#6B46C1] focus:ring-[#6B46C1]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-[#374151]">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@company.com" 
                          data-testid="input-email" 
                          className="h-12 border-[#E5E7EB] rounded-md focus:border-[#6B46C1] focus:ring-[#6B46C1]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-[#374151]">
                        Company
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Company name" 
                          data-testid="input-company" 
                          className="h-12 border-[#E5E7EB] rounded-md focus:border-[#6B46C1] focus:ring-[#6B46C1]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-[#374151]">
                        Message (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your energy consumption..." 
                          className="resize-none min-h-[120px] border-[#E5E7EB] rounded-md focus:border-[#6B46C1] focus:ring-[#6B46C1]"
                          data-testid="input-message"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <button 
                  type="submit" 
                  className="btn-primary-dcvc w-full"
                  disabled={submitLead.isPending}
                  data-testid="button-submit-lead"
                >
                  {submitLead.isPending ? "Sending..." : "Submit Request"}
                </button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
