using AutoMapper;
using OVRSystem.API.DTOs;
using OVRSystem.API.Models;

namespace OVRSystem.API.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mappings
        CreateMap<ApplicationUser, UserDto>()
            .ForMember(dest => dest.Facility, opt => opt.MapFrom(src => src.Facility));
        
        CreateMap<RegisterDto, UserRegistration>();

        // Facility mappings
        CreateMap<Facility, FacilityDto>();

        // Incident mappings
        CreateMap<Incident, IncidentDto>()
            .ForMember(dest => dest.Facility, opt => opt.MapFrom(src => src.Facility))
            .ForMember(dest => dest.Comments, opt => opt.MapFrom(src => src.Comments));
        
        CreateMap<CreateIncidentDto, Incident>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.OvrId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.SubmittedBy, opt => opt.Ignore());

        // Comment mappings
        CreateMap<IncidentComment, IncidentCommentDto>()
            .ForMember(dest => dest.User, opt => opt.MapFrom(src => src.User));
        
        CreateMap<CreateCommentDto, IncidentComment>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.IncidentId, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

        // UserRegistration mappings
        CreateMap<UserRegistration, UserRegistrationDto>()
            .ForMember(dest => dest.Facility, opt => opt.MapFrom(src => src.Facility));
    }
}