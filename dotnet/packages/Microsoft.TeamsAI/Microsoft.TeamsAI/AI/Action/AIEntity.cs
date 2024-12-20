﻿using Microsoft.Bot.Schema;
using Newtonsoft.Json;

namespace Microsoft.Teams.AI.AI.Action
{
    /// <summary>
    /// The citations's AIEntity.
    /// </summary>
    public class AIEntity : Entity
    {
        /// <summary>
        /// Required. Must be "https://schema.org/Message"
        /// </summary>
        [JsonProperty(PropertyName = "type")]
        public new string Type = "https://schema.org/Message";

        /// <summary>
        /// Required. Must be "Message".
        /// </summary>
        [JsonProperty(PropertyName = "@type")]
        public string AtType = "Message";

        /// <summary>
        /// Required. Must be "https://schema.org"
        /// </summary>
        [JsonProperty(PropertyName = "@context")]
        public string AtContext = "https://schema.org";

        /// <summary>
        /// Must be left blank. This is for Bot Framework's schema.
        /// </summary>
        [JsonProperty(PropertyName = "@id")]
        public string AtId = "";

        /// <summary>
        /// Indicate that the content was generated by AI.
        /// </summary>
        [JsonProperty(PropertyName = "additionalType")]
        public List<string> AdditionalType = new() { "AIGeneratedContent" };

        /// <summary>
        /// Optional. If the citation object is included, then the sent activity will include citations that are referenced in the activity text.
        /// </summary>
        [JsonProperty(PropertyName = "citation")]
        public List<ClientCitation> Citation { get; set; } = new();

        /// <summary>
        /// Optional sensitivity content information.
        /// </summary>
        [JsonProperty(PropertyName = "usageInfo")]
        public SensitivityUsageInfo? UsageInfo { get; set; }
    }

    /// <summary>
    /// The client citation.
    /// </summary>
    public class ClientCitation
    {
        /// <summary>
        /// Required. Must be "Claim".
        /// </summary>
        [JsonProperty(PropertyName = "@type")]
        public string AtType = "Claim";

        /// <summary>
        /// Required. Number and position of the citation.
        /// </summary>
        [JsonProperty(PropertyName = "position")]
        public string Position { get; set; } = string.Empty;

        /// <summary>
        /// The citation's appearance.
        /// </summary>
        [JsonProperty(PropertyName = "appearance")]
        public ClientCitationAppearance? Appearance { get; set; }

    }

    /// <summary>
    /// The client citation appearance.
    /// </summary>
    public class ClientCitationAppearance
    {
        /// <summary>
        /// Required. Must be "DigitalDocument"
        /// </summary>
        [JsonProperty(PropertyName = "@type")]
        public string AtType = "DigitalDocument";

        /// <summary>
        /// Name of the document.
        /// </summary>
        [JsonProperty(PropertyName = "name")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Optional. The citation appearance text.
        /// </summary>
        [JsonProperty(PropertyName = "text")]
        public string? Text { get; set; }

        /// <summary>
        /// URL of the document. This will make the name of the citation clickable and direct the user to the specified URL.
        /// </summary>
        [JsonProperty(PropertyName = "url")]
        public string? Url { get; set; }

        /// <summary>
        /// Content of the citation. Must be clipped if longer than 480 characters.
        /// </summary>
        [JsonProperty(PropertyName = "abstract")]
        public string Abstract { get; set; } = string.Empty;

        /// <summary>
        /// Optional. Encoding format of the `citation.appearance.text` field.
        /// </summary>
        [JsonProperty(PropertyName = "encodingFormat")]
        public string? EncodingFormat { get; set; }

        /// <summary>
        /// The icon provided in the citation ui.
        /// </summary>
        [JsonProperty(PropertyName = "image")]
        public string? Image { get; set; }

        /// <summary>
        /// Optional. Set the keywords.
        /// </summary>
        [JsonProperty(PropertyName = "keywords")]
        public List<string>? Keywords { get; set; }

        /// <summary>
        /// Optional sensitivity content information.
        /// </summary>
        [JsonProperty(PropertyName = "usageInfo")]
        public SensitivityUsageInfo? UsageInfo { get; set; }
    }

    /// <summary>
    /// The sensitivity usage info.
    /// </summary>
    public class SensitivityUsageInfo
    {
        /// <summary>
        /// Must be "https://schema.org/Message"
        /// </summary>
        [JsonProperty(PropertyName = "type")]
        public string Type = "https://schema.org/Message";

        /// <summary>
        /// Required. Set to "CreativeWork".
        /// </summary>
        [JsonProperty(PropertyName = "@type")]
        public string AtType = "CreativeWork";

        /// <summary>
        /// Sensitivity description of the content.
        /// </summary>
        [JsonProperty(PropertyName = "description")]
        public string? Description { get; set; }

        /// <summary>
        /// Sensitivity title of the content.
        /// </summary>
        [JsonProperty(PropertyName = "name")]
        public string? Name { get; set; }

        /// <summary>
        /// Optional. Ignored in Teams
        /// </summary>
        [JsonProperty(PropertyName = "position")]
        public int Position { get; set; }

        /// <summary>
        /// The sensitivity usage info pattern.
        /// </summary>
        [JsonProperty(PropertyName = "pattern")]
        public SensitivityUsageInfoPattern? Pattern;
    }

    /// <summary>
    /// The sensitivity usage info pattern.
    /// </summary>
    public class SensitivityUsageInfoPattern
    {
        /// <summary>
        /// Set to "DefinedTerm".
        /// </summary>
        [JsonProperty(PropertyName = "@type")]
        public string AtType = "DefinedTerm";

        /// <summary>
        /// Whether it's in a defined term set.
        /// </summary>
        [JsonProperty(PropertyName = "inDefinedTermSet")]
        public string? inDefinedTermSet { get; set; }

        /// <summary>
        /// The color.
        /// </summary>
        [JsonProperty(PropertyName = "name")]
        public string? Name { get; set; }

        /// <summary>
        /// For example `#454545`.
        /// </summary>
        [JsonProperty(PropertyName = "termCode")]
        public string? TermCode { get; set; }
    }
}
